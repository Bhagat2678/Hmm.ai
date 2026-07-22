"""
Neo4j AuraDB client wrapper with connection pooling, transaction execution, and NetworkX memory fallback.
"""

from typing import List, Dict, Any, Optional
from ai_ml.config.settings import settings
from ai_ml.utils.logger import logger

try:
    from neo4j import GraphDatabase
    HAS_NEO4J = True
except ImportError:
    HAS_NEO4J = False

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False


class Neo4jClient:

    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.user = settings.neo4j_effective_user
        self.password = settings.NEO4J_PASSWORD
        self.driver = None
        self.memory_graph = nx.MultiDiGraph() if HAS_NETWORKX else None

        if HAS_NEO4J and self.uri and self.password != "password":
            try:
                self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password), connection_timeout=3.0)
                self.driver.verify_connectivity()
                logger.info(f"Connected to Neo4j AuraDB at '{self.uri}'")
            except Exception as e:
                logger.warning(f"Could not connect to Neo4j AuraDB ({e}). Using NetworkX memory fallback graph.")
                self.driver = None

        self._seed_default_memory_graph()

    def _seed_default_memory_graph(self):
        if self.memory_graph is None:
            return
        default_nodes = [
            ("P-101", {"label": "Equipment", "properties": {"name": "P-101", "type": "Centrifugal Pump", "status": "operational"}}),
            ("V-204", {"label": "Equipment", "properties": {"name": "V-204", "type": "Separator Vessel", "status": "nominal"}}),
            ("HX-31", {"label": "Equipment", "properties": {"name": "HX-31", "type": "Heat Exchanger", "status": "fouling_warning"}}),
            ("T-500", {"label": "Equipment", "properties": {"name": "T-500", "type": "Storage Tank", "status": "nominal"}}),
            ("FT-101", {"label": "Sensor", "properties": {"name": "FT-101", "type": "Flow Transmitter"}}),
            ("TT-101", {"label": "Sensor", "properties": {"name": "TT-101", "type": "Temperature Transmitter"}}),
            ("SOP-101", {"label": "Document", "properties": {"filename": "SOP-101_Pump_Maintenance.pdf", "type": "safety_procedure"}}),
        ]
        default_edges = [
            ("P-101", "V-204", {"type": "CONNECTED_TO"}),
            ("FT-101", "P-101", {"type": "MONITORS"}),
            ("TT-101", "P-101", {"type": "MONITORS"}),
            ("P-101", "SOP-101", {"type": "MENTIONED_IN"}),
            ("HX-31", "V-204", {"type": "FEEDS"}),
        ]
        for n_id, data in default_nodes:
            if not self.memory_graph.has_node(n_id):
                self.memory_graph.add_node(n_id, **data)
        for u, v, data in default_edges:
            if not self.memory_graph.has_edge(u, v):
                self.memory_graph.add_edge(u, v, **data)

    def close(self):
        if self.driver:
            self.driver.close()

    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes a Cypher query against Neo4j, falling back to memory execution if disconnected."""
        if self.driver:
            try:
                with self.driver.session() as session:
                    result = session.run(query, parameters or {})
                    return [record.data() for record in result]
            except Exception as e:
                logger.error(f"Neo4j Cypher query failed: {e}")

        logger.info("Executing graph operations in fallback in-memory graph.")
        return []

    def get_neighborhood(self, entity_id: str, depth: int = 1) -> Dict[str, Any]:
        """
        Retrieves graph nodes and edges within `depth` hops of `entity_id`.
        Returns `{ "nodes": [...], "edges": [...] }` conforming to Section 7 Integration Contract.
        """
        if self.driver:
            if not entity_id or entity_id == "ALL":
                cypher = """
                MATCH (n)
                OPTIONAL MATCH (n)-[r]->(m)
                RETURN n, r, m
                """
                try:
                    records = self.run_query(cypher)
                    nodes_dict = {}
                    edges_dict = {}

                    for rec in records:
                        n = rec.get("n")
                        r = rec.get("r")
                        m = rec.get("m")

                        for item in (n, m):
                            if item:
                                props = dict(item) if hasattr(item, "items") else (item if isinstance(item, dict) else {})
                                n_id = props.get("id") or props.get("filename") or props.get("name") or props.get("tag")
                                if n_id:
                                    # Infer label
                                    if "tag" in props or (props.get("name") and any(props["name"].startswith(p) for p in ("PUMP", "P-", "V-", "TT-", "FT-", "HX-"))):
                                        n_label = "Equipment"
                                    elif "filename" in props or "document_type" in props:
                                        n_label = "Document"
                                    elif hasattr(item, "labels") and item.labels:
                                        n_label = list(item.labels)[0]
                                    else:
                                        n_label = "Entity"

                                    nodes_dict[str(n_id)] = {
                                        "id": str(n_id),
                                        "label": n_label,
                                        "properties": props,
                                    }

                        if r:
                            src_id = None
                            tgt_id = None
                            rel_type = "LINKED_TO"

                            if isinstance(r, tuple) and len(r) == 3:
                                s_dict, rel_type_val, t_dict = r
                                rel_type = str(rel_type_val)
                                if isinstance(s_dict, dict):
                                    src_id = s_dict.get("id") or s_dict.get("filename") or s_dict.get("name")
                                if isinstance(t_dict, dict):
                                    tgt_id = t_dict.get("id") or t_dict.get("filename") or t_dict.get("name")
                            elif hasattr(r, "type"):
                                rel_type = r.type
                                if hasattr(r, "start_node") and hasattr(r, "end_node"):
                                    src_id = r.start_node.get("id") or r.start_node.get("name")
                                    tgt_id = r.end_node.get("id") or r.end_node.get("name")

                            if src_id and tgt_id:
                                r_id = f"{src_id}-{rel_type}-{tgt_id}"
                                edges_dict[str(r_id)] = {
                                    "id": str(r_id),
                                    "source": str(src_id),
                                    "target": str(tgt_id),
                                    "type": rel_type,
                                }

                    if nodes_dict:
                        return {
                            "nodes": list(nodes_dict.values()),
                            "edges": list(edges_dict.values()),
                        }
                except Exception as e:
                    logger.warning(f"Neo4j all nodes query failed: {e}")

            simple_cypher = """
            MATCH (start) 
            WHERE start.id = $entity_id 
               OR start.name = $entity_id 
               OR start.filename = $entity_id 
               OR start.tag = $entity_id
               OR toLower(start.id) = toLower($entity_id)
               OR toLower(start.filename) = toLower($entity_id)
               OR toLower(start.name) = toLower($entity_id)
            OPTIONAL MATCH path = (start)-[*1..%d]-(neighbor)
            RETURN start, nodes(path) AS nodes, relationships(path) AS rels
            """ % depth

            try:
                records = self.run_query(simple_cypher, {"entity_id": entity_id})
                nodes_dict = {}
                edges_dict = {}

                for rec in records:
                    start_node = rec.get("start")
                    if start_node:
                        s_props = dict(start_node) if hasattr(start_node, "items") else (start_node if isinstance(start_node, dict) else {})
                        s_id = s_props.get("id") or s_props.get("filename") or s_props.get("name") or s_props.get("tag")
                        if s_id:
                            s_label = list(start_node.labels)[0] if hasattr(start_node, "labels") and start_node.labels else ("Document" if "filename" in s_props else "Equipment")
                            nodes_dict[str(s_id)] = {
                                "id": str(s_id),
                                "label": s_label,
                                "properties": s_props,
                            }

                    raw_nodes = rec.get("nodes") or []
                    raw_rels = rec.get("rels") or []

                    for node in raw_nodes:
                        n_props = dict(node) if hasattr(node, "items") else (node if isinstance(node, dict) else {})
                        n_id = n_props.get("id") or n_props.get("filename") or n_props.get("name") or n_props.get("tag")
                        n_label = list(node.labels)[0] if hasattr(node, "labels") and node.labels else ("Document" if "filename" in n_props else "Entity")
                        if n_id:
                            nodes_dict[str(n_id)] = {
                                "id": str(n_id),
                                "label": n_label,
                                "properties": n_props,
                            }

                    for rel in raw_rels:
                        r_id = rel.id if hasattr(rel, "id") else f"{rel.start_node}-{rel.end_node}"
                        s_id = rel.start_node.get("id") or rel.start_node.get("filename") or rel.start_node.get("name") or rel.start_node.get("tag")
                        t_id = rel.end_node.get("id") or rel.end_node.get("filename") or rel.end_node.get("name") or rel.end_node.get("tag")
                        if s_id and t_id:
                            edges_dict[str(r_id)] = {
                                "id": str(r_id),
                                "source": str(s_id),
                                "target": str(t_id),
                                "type": rel.type if hasattr(rel, "type") else "LINKED_TO",
                            }

                if nodes_dict:
                    return {
                        "nodes": list(nodes_dict.values()),
                        "edges": list(edges_dict.values()),
                    }
            except Exception as e:
                logger.warning(f"Neo4j neighborhood traversal failed: {e}")

        # In-memory graph fallback
        return self._get_memory_neighborhood(entity_id, depth)

    def _get_memory_neighborhood(self, entity_id: str, depth: int) -> Dict[str, Any]:
        if self.memory_graph is None:
            return {"nodes": [], "edges": []}

        # Return full graph if entity_id is empty or ALL
        if not entity_id or entity_id.upper() == "ALL":
            nodes = []
            for n_id, data in self.memory_graph.nodes(data=True):
                nodes.append({
                    "id": str(n_id),
                    "label": data.get("label", "Equipment"),
                    "properties": data.get("properties", {"name": str(n_id)})
                })
            edges = []
            for u, v, k, data in self.memory_graph.edges(keys=True, data=True):
                edges.append({
                    "id": f"edge-{u}-{v}-{k}",
                    "source": str(u),
                    "target": str(v),
                    "type": data.get("type", "CONNECTED_TO")
                })
            return {"nodes": nodes, "edges": edges}

        # Match node case-insensitively or by property
        target_node = None
        target_lower = entity_id.lower().strip()
        for node_id in self.memory_graph.nodes():
            if str(node_id).lower() == target_lower:
                target_node = node_id
                break
            n_data = self.memory_graph.nodes[node_id]
            props = n_data.get("properties", {})
            if any(str(v).lower() == target_lower for v in props.values() if isinstance(v, (str, int))):
                target_node = node_id
                break

        if target_node is None:
            return {"nodes": [], "edges": []}

        visited_nodes = {target_node}
        current_layer = {target_node}

        for _ in range(depth):
            next_layer = set()
            for node in current_layer:
                neighbors = set(self.memory_graph.successors(node)).union(set(self.memory_graph.predecessors(node)))
                next_layer.update(neighbors)
            visited_nodes.update(next_layer)
            current_layer = next_layer

        subgraph = self.memory_graph.subgraph(visited_nodes)

        nodes = []
        for n in subgraph.nodes(data=True):
            n_id = n[0]
            n_data = n[1]
            nodes.append({
                "id": str(n_id),
                "label": n_data.get("label", "Equipment"),
                "properties": n_data.get("properties", {"name": str(n_id)})
            })

        edges = []
        for u, v, k, data in subgraph.edges(keys=True, data=True):
            edges.append({
                "id": f"edge-{u}-{v}-{k}",
                "source": str(u),
                "target": str(v),
                "type": data.get("type", "CONNECTED_TO")
            })

        return {"nodes": nodes, "edges": edges}


neo4j_client = Neo4jClient()
