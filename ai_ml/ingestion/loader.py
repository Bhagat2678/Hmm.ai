"""
Universal Document Loader for parsing PDFs, spreadsheets, images, text, and email files.
"""

import io
import pandas as pd
from typing import Dict, Any, Tuple, Optional
from PIL import Image

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

from ai_ml.utils.logger import logger


class DocumentLoader:

    def load(self, file_content: bytes, filename: str, mime_type: Optional[str] = None) -> Tuple[str, Optional[bytes], str]:
        """
        Loads document content bytes.
        Returns tuple: (extracted_text, image_bytes_for_vision, detected_mime_type)
        """
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        
        # 1. PDF
        if ext == "pdf" or (mime_type and "pdf" in mime_type):
            return self._load_pdf(file_content)

        # 2. DOCX / DOC
        elif ext in ["docx", "doc"]:
            return self._load_docx(file_content).replace("\x00", ""), None, "text/plain"

        # 3. Excel / CSV
        elif ext in ["xlsx", "xls", "csv"]:
            return self._load_spreadsheet(file_content, ext).replace("\x00", ""), None, "text/plain"

        # 4. Image (JPEG, PNG, WEBP) - for P&ID / scanned forms
        elif ext in ["png", "jpg", "jpeg", "webp"] or (mime_type and "image" in mime_type):
            mtype = f"image/{ext}" if ext in ["png", "jpg", "jpeg", "webp"] else "image/jpeg"
            return "", file_content, mtype

        # 5. Text / Markdown / Log / EML
        else:
            try:
                text = file_content.decode("utf-8", errors="replace").replace("\x00", "")
                return text, None, "text/plain"
            except Exception as e:
                logger.error(f"Failed to decode text file: {e}")
                return "", None, "application/octet-stream"

    def _load_pdf(self, file_content: bytes) -> Tuple[str, Optional[bytes], str]:
        extracted_text = ""
        
        # Try pdfplumber first for superior text & table extraction
        if HAS_PDFPLUMBER:
            try:
                with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                    for page in pdf.pages:
                        t = page.extract_text()
                        if t:
                            extracted_text += t + "\n"
            except Exception as e:
                logger.warning(f"pdfplumber failed: {e}")

        # Fallback to pypdf if pdfplumber empty or unavailable
        if not extracted_text.strip() and HAS_PYPDF:
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        extracted_text += t + "\n"
            except Exception as e:
                logger.warning(f"pypdf failed: {e}")

        # If still no text (scanned PDF), return file_content as image/pdf for Gemini multimodal
        if not extracted_text.strip():
            logger.info("No inline text found in PDF; treating as scanned multimodal document.")
            return "", file_content, "application/pdf"

        return extracted_text.strip(), None, "text/plain"

    def _load_spreadsheet(self, file_content: bytes, ext: str) -> str:
        try:
            if ext == "csv":
                df = pd.read_csv(io.BytesIO(file_content))
            else:
                df = pd.read_excel(io.BytesIO(file_content))
            return df.to_string(index=False)
        except Exception as e:
            logger.error(f"Failed to parse spreadsheet: {e}")
            return file_content.decode("utf-8", errors="ignore")

    def _load_docx(self, file_content: bytes) -> str:
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(file_content)) as z:
                xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            texts = [node.text for node in tree.iter() if node.text]
            return "\n".join(texts)
        except Exception as e:
            logger.warning(f"Zipfile docx extraction failed: {e}")
            return file_content.decode("utf-8", errors="ignore")


document_loader = DocumentLoader()
