from pathlib import Path
from docx import Document
import sys

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("contacts/Contract of Sale.docx")
dump_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("contacts/contract_dump.txt")

doc = Document(source)

with dump_path.open("w", encoding="utf-8") as f:
    for i, paragraph in enumerate(doc.paragraphs):
        text = paragraph.text.strip()
        if text:
            f.write(f"{i}: {text}\n")

print(f"Wrote contract dump to {dump_path} from {source}")

