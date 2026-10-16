"""Builds <name>.layout.json from an AXe describe-ui dump of the binder home.

Every meaningful element (navigation bar items, the "Next up" card and its parts, the "Later"
rows, the dock, the helper chips, the glance cards, the tab bar and its tabs) with its frame in
points, its label and a kind. Frames are the app's own accessibility frames (exact, points,
origin top-left of the 402 x 874 pt screen). `onFirstScreen` says whether it is visible
(not cut off) in the still; `clippedFrame` is the part inside the screen.

    python3 layout.py <ax.json> <screenshot.png> <out.json> <appearance>
"""
import json
import struct
import sys

SCREEN_W, SCREEN_H = 402.0, 874.0          # iPhone 17 Pro, points
SCALE = 3                                   # pixels per point in the stills and videos
SAFE_TOP = 62.0                             # status bar / Dynamic Island safe area (nav bar starts here)
SAFE_BOTTOM = 34.0                          # home indicator safe area
HOME_INDICATOR = {"x": 134.0, "y": 861.0, "w": 134.0, "h": 5.0}  # the bar itself (iOS standard geometry)
STATUS_BAR = {"x": 0.0, "y": 0.0, "w": 402.0, "h": 54.0}
DYNAMIC_ISLAND = {"x": 138.5, "y": 11.0, "w": 125.0, "h": 37.0}

# Toolbar glass buttons draw about 4 pt beyond their accessibility frame (measured on the still).
GLASS_OUTSET = 4.0

INTERACTIVE = {"Button", "PopUpButton", "RadioButton"}


def png_size(path):
    with open(path, "rb") as handle:
        head = handle.read(24)
    return struct.unpack(">II", head[16:24])


def flatten(node, parents, out):
    out.append((node, parents))
    for child in node.get("children") or []:
        flatten(child, parents + [node], out)
    return out


def frame_of(node):
    f = node.get("frame") or {}
    return {"x": round(f.get("x", 0), 1), "y": round(f.get("y", 0), 1),
            "w": round(f.get("width", 0), 1), "h": round(f.get("height", 0), 1)}


def kind_for(node, parents):
    t, ident, label = node.get("type"), node.get("AXUniqueId") or "", node.get("AXLabel") or ""
    if t == "RadioButton":
        return "tabBarTab"
    if t == "PopUpButton" and label.startswith("Binder:"):
        return "binderSwitcher"
    if t == "Heading" and parents and any((p.get("AXUniqueId") or "") == "Mom" for p in parents):
        return "navTitle"
    if t == "Heading":
        return "sectionHeader"
    if ident.startswith("helper."):
        return "helperChip"
    if ident.startswith("glance."):
        return "glanceCard"
    if ident in ("emergency.entry",) or ident.startswith(("dock.", "bills.entry", "packets.entry", "more.entry")):
        return "dockButton"
    if ident == "home.headline":
        return "headline"
    if ident == "home.attention.more":
        return "link"
    if ident == "home.family.activity":
        return "familyCard"
    if label in ("Search", "Add") and t in ("Button", "Group"):
        return "navButton"
    if label.startswith(("Done:", "Snooze")):
        return "nextUpAction"
    if t == "GenericElement" and label.startswith("Page"):
        return "pageIndicator"
    return "row" if t in INTERACTIVE else None


def keep(node, parents):
    t = node.get("type")
    if t == "Group" and node.get("AXLabel") == "Add":
        return True
    if t == "Button" and node.get("AXLabel") == "Add" and any(p.get("AXLabel") == "Add" for p in parents):
        return False
    if t in ("Application", "Group", "ScrollArea", "Slider", "Image"):
        return False
    if t == "StaticText":
        return node.get("AXUniqueId") == "home.headline"
    # A button nested in a button of the same frame is the same thing twice.
    if t in INTERACTIVE and parents and parents[-1].get("type") in INTERACTIVE | {"PopUpButton"}:
        return False
    if t == "Button" and parents and parents[-1].get("type") == "PopUpButton":
        return False
    return True


def texts_inside(node):
    found = []
    for child, _ in flatten(node, [], [])[1:]:
        if child.get("type") == "StaticText" and child.get("AXLabel"):
            found.append({"text": child["AXLabel"], **frame_of(child)})
    return found


def clip(frame):
    x0, y0 = max(frame["x"], 0), max(frame["y"], 0)
    x1, y1 = min(frame["x"] + frame["w"], SCREEN_W), min(frame["y"] + frame["h"], SCREEN_H)
    if x1 <= x0 or y1 <= y0:
        return None
    return {"x": round(x0, 1), "y": round(y0, 1), "w": round(x1 - x0, 1), "h": round(y1 - y0, 1)}


def build(ax_path, png_path, appearance):
    with open(ax_path) as handle:
        roots = json.load(handle)
    rows = []
    for root in roots:
        flatten(root, [], rows)
    elements = []
    for node, parents in rows:
        if not keep(node, parents):
            continue
        kind = kind_for(node, parents)
        if kind is None:
            continue
        frame = frame_of(node)
        clipped = clip(frame)
        full = clipped is not None and clipped == frame
        elements.append({
            "kind": kind, "label": node.get("AXLabel"), "id": node.get("AXUniqueId"),
            "frame": frame, "clippedFrame": clipped, "onFirstScreen": clipped is not None,
            "fullyVisible": full, "texts": texts_inside(node),
        })
    # The Next up card (the countdown) is a button: call it out.
    for e in elements:
        if e["kind"] == "row" and e["label"] and e["label"].startswith("Tomorrow"):
            e["kind"] = "nextUpCard"
        elif e["kind"] == "row" and e["label"] and ", Due in" in e["label"] or (e["label"] or "").find(", Expires in") > 0:
            e["kind"] = "laterRow"
    tab_bar = next((frame_of(n) for n, _ in rows if n.get("AXLabel") == "Tab Bar"), None)
    # The floating tab bar's capsule: the first child group of "Tab Bar".
    capsule = next((frame_of((n.get("children") or [{}])[0]) for n, _ in rows if n.get("AXLabel") == "Tab Bar"), None)
    for e in elements:
        if e["kind"] in ("binderSwitcher", "navButton"):
            f = e["frame"]
            e["glassFrame"] = {"x": round(f["x"] - GLASS_OUTSET, 1), "y": round(f["y"] - GLASS_OUTSET, 1),
                               "w": round(f["w"] + 2 * GLASS_OUTSET, 1), "h": round(f["h"] + 2 * GLASS_OUTSET, 1)}
    pw, ph = png_size(png_path)
    return {
        "source": "Provisum 1.2 (release/1.2), Simulator iPhone 17 Pro, iOS 27.0; AXe describe-ui accessibility frames",
        "appearance": appearance,
        "still": png_path.split("/")[-1],
        "screen": {"wPt": SCREEN_W, "hPt": SCREEN_H, "scale": SCALE, "wPx": pw, "hPx": ph},
        "safeArea": {"top": SAFE_TOP, "bottom": SAFE_BOTTOM, "left": 0, "right": 0},
        "statusBar": STATUS_BAR, "dynamicIsland": DYNAMIC_ISLAND,
        "homeIndicator": HOME_INDICATOR,
        "tabBar": tab_bar,
        "tabBarCapsule": capsule,
        "notes": [
            "Frames are points, origin top-left of the screen; multiply by 3 for the PNG/video pixels.",
            "The home scrolls: elements with onFirstScreen=false are below the fold in the still.",
            "The tab bar floats over content (Liquid Glass); content under it is visible through it.",
            "statusBar, dynamicIsland and homeIndicator are iOS standard geometry for this device, not read from the app; simctl stills do not draw the home indicator, so it is absent from the PNGs and videos.",
            "Helper chips are a horizontal strip: chips past x=402 are off screen to the right.",
            "glassFrame (toolbar items) is the drawn Liquid Glass circle/capsule; frame is the tap target.",
            "The -still.png (simctl screenshot) has no Dynamic Island; the videos and their posters show the black Dynamic Island pill (dynamicIsland frame). Everything else is pixel-identical.",
            "Dock buttons: the 52 pt circle sits at the top-centre of the frame, the label under it.",
        ],
        "elements": elements,
    }


def main():
    ax_path, png_path, out_path, appearance = sys.argv[1:5]
    layout = build(ax_path, png_path, appearance)
    with open(out_path, "w") as handle:
        json.dump(layout, handle, indent=1)
    print(out_path, len(layout["elements"]), "elements")


if __name__ == "__main__":
    main()
