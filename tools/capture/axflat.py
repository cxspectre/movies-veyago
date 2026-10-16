"""Flattens an AXe describe-ui JSON dump into one line per element: type, label, frame (points)."""
import json
import sys


def walk(node, depth, out):
    frame = node.get("frame") or {}
    out.append({
        "depth": depth,
        "type": node.get("type"),
        "role": node.get("role_description"),
        "label": node.get("AXLabel"),
        "value": node.get("AXValue"),
        "id": node.get("AXUniqueId"),
        "x": frame.get("x"), "y": frame.get("y"), "w": frame.get("width"), "h": frame.get("height"),
    })
    for child in node.get("children") or []:
        walk(child, depth + 1, out)
    return out


def main():
    with open(sys.argv[1]) as handle:
        roots = json.load(handle)
    rows = []
    for root in roots:
        walk(root, 0, rows)
    if len(sys.argv) > 2 and sys.argv[2] == "--json":
        json.dump(rows, sys.stdout, indent=1)
        return
    for r in rows:
        print(f"{'  ' * r['depth']}{r['type']} [{r['label']}] val={r['value']} id={r['id']} "
              f"({r['x']:.1f},{r['y']:.1f},{r['w']:.1f},{r['h']:.1f})")


if __name__ == "__main__":
    main()
