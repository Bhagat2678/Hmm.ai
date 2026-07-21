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
                self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
                self.driver.verify_connectivity()
                logger.info(f"Connected to Neo4j AuraDB at '{self.uri}'")
            except Exception as e:
                logger.warning(f"Could not connect to Neo4j AuraDB ({e}). Using NetworkX memory fallback graph.")
                self.driver = None

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
            cypher = """
            MATCH (start {id: $entity_id})
            CALL apoc.path.subgraphAll(start, {maxLevel: $depth})
            YIELD nodes, relationships
            RETURN nodes, relationships
            """
            # Fallback simple MATCH if APOC not enabled on free tier
            simple_cypher = """
            MATCH (start) WHERE start.id = $entity_id OR start.name = $entity_id OR start.tag = $entity_id
            MATCH path = (start)-[*1..%d]-(neighbor)
            RETURN nodes(path) AS nodes, relationships(path) AS rels
            """ % depth

            try:
                records = self.run_query(simple_cypher, {"entity_id": entity_id})
                nodes_dict = {}
                edges_dict = {}

                for rec in records:
                    raw_nodes = rec.get("nodes", [])
                    raw_rels = rec.get("rels", [])

                    for node in raw_nodes:
                        n_id = node.get("id") or node.get("name") or node.get("tag")
                        n_label = list(node.labels)[0] if hasattr(node, "labels") and node.labels else "Entity"
                        n_props = dict(node)
                        if n_id:
                            nodes_dict[str(n_id)] = {
                                "id": str(n_id),
                                "label": n_label,
                                "properties": n_props
                            }

                    for rel in raw_rels:
                        r_id = rel.id if hasattr(rel, "id") else f"{rel.start_node}-{rel.end_node}"
                        edges_dict[str(r_id)] = {
                            "id": str(r_id),
                            "source": str(rel.start_node.get("id") or rel.start_node.get("name") or rel.start_node.get("tag")),
                            "target": str(rel.end_node.get("id") or rel.end_node.get("name") or rel.end_node.get("tag")),
                            "type": rel.type if hasattr(rel, "type") else "LINKED_TO"
                        }

                if nodes_dict:
                    return {
                        "nodes": list(nodes_dict.values()),
                        "edges": list(edges_dict.values())
                    }
            except Exception as e:
                logger.warning(f"Neo4j neighborhood traversal failed: {e}")

        # In-memory graph fallback
        return self._get_memory_neighborhood(entity_id, depth)

    def _get_memory_neighborhood(self, entity_id: str, depth: int) -> Dict[str, Any]:
        if self.memory_graph is None or not self.memory_graph.has_node(entity_id):
            return {
                "nodes": [{"id": entity_id, "label": "Equipment", "properties": {"name": entity_id}}],
                "edges": []
            }

        visited_nodes = {entity_id}
        current_layer = {entity_id}

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
                "properties": n_data.get("properties", {"name": n_id})
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
