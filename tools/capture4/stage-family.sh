#!/bin/zsh
# stage-family.sh : turns the seeded sample (OB_SEED_SAMPLE=1 OB_SECOND_BINDER=1: Mom + Dad) into the
# story's family binders by editing the app's local SwiftData store while the app is not running
# (staged data; the screens that show them are the real app). Mom's full sample binder becomes
# "Dad" (Robert Hughes), the sample "Dad" becomes "Leo", and five binders are added: Mia, Maya,
# Jonas, Biscuit, Sam. Each binder then gets its own wallpaper (ob.wallpaper.binders).
source "${0:A:h}/env.sh"
xcrun simctl terminate "$PHONE" "$BUNDLE" 2>/dev/null; sleep 1
D=$(xcrun simctl get_app_container "$PHONE" "$BUNDLE" data) || exit 1
DB="$D/Library/Application Support/Binders.store"
[[ -f "$DB" ]] || { echo "no store at $DB" >&2; exit 1; }
sqlite3 "$DB" <<SQL || { echo "store edit failed" >&2; exit 1; }
BEGIN;
UPDATE ZBINDER SET ZLABEL='Dad', ZFULLNAME='Robert Hughes', ZCOLORRAW='blue' WHERE ZLABEL='Mom';
UPDATE ZBINDER SET ZLABEL='Leo', ZFULLNAME='Leo Hughes', ZCOLORRAW='teal', ZPERSONTYPERAW='child', ZSORTORDER=1 WHERE ZFULLNAME='Robert Hughes' AND ZLABEL='Dad' AND ZSORTORDER=1;
INSERT INTO ZBINDER (Z_PK,Z_ENT,Z_OPT,ZISSAMPLE,ZSORTORDER,ZCREATEDAT,ZUPDATEDAT,ZCOLORRAW,ZCOUNTRYCODE,ZFULLNAME,ZLABEL,ZPERSONTYPERAW,ZID)
  SELECT (SELECT MAX(Z_PK) FROM ZBINDER)+1, Z_ENT, 1, 0, 2, ZCREATEDAT, ZUPDATEDAT, 'pink', ZCOUNTRYCODE, 'Mia Hughes', 'Mia', 'child', randomblob(16) FROM ZBINDER WHERE ZLABEL='Leo';
INSERT INTO ZBINDER (Z_PK,Z_ENT,Z_OPT,ZISSAMPLE,ZSORTORDER,ZCREATEDAT,ZUPDATEDAT,ZCOLORRAW,ZCOUNTRYCODE,ZFULLNAME,ZLABEL,ZPERSONTYPERAW,ZID)
  SELECT (SELECT MAX(Z_PK) FROM ZBINDER)+1, Z_ENT, 1, 0, 3, ZCREATEDAT, ZUPDATEDAT, 'violet', ZCOUNTRYCODE, 'Maya Hughes', 'Maya', 'myself', randomblob(16) FROM ZBINDER WHERE ZLABEL='Leo';
INSERT INTO ZBINDER (Z_PK,Z_ENT,Z_OPT,ZISSAMPLE,ZSORTORDER,ZCREATEDAT,ZUPDATEDAT,ZCOLORRAW,ZCOUNTRYCODE,ZFULLNAME,ZLABEL,ZPERSONTYPERAW,ZID)
  SELECT (SELECT MAX(Z_PK) FROM ZBINDER)+1, Z_ENT, 1, 0, 4, ZCREATEDAT, ZUPDATEDAT, 'green', ZCOUNTRYCODE, 'Jonas Weber', 'Jonas', 'partner', randomblob(16) FROM ZBINDER WHERE ZLABEL='Leo';
INSERT INTO ZBINDER (Z_PK,Z_ENT,Z_OPT,ZISSAMPLE,ZSORTORDER,ZCREATEDAT,ZUPDATEDAT,ZCOLORRAW,ZCOUNTRYCODE,ZFULLNAME,ZLABEL,ZPERSONTYPERAW,ZID)
  SELECT (SELECT MAX(Z_PK) FROM ZBINDER)+1, Z_ENT, 1, 0, 5, ZCREATEDAT, ZUPDATEDAT, 'orange', ZCOUNTRYCODE, 'Biscuit', 'Biscuit', 'pet', randomblob(16) FROM ZBINDER WHERE ZLABEL='Leo';
INSERT INTO ZBINDER (Z_PK,Z_ENT,Z_OPT,ZISSAMPLE,ZSORTORDER,ZCREATEDAT,ZUPDATEDAT,ZCOLORRAW,ZCOUNTRYCODE,ZFULLNAME,ZLABEL,ZPERSONTYPERAW,ZID)
  SELECT (SELECT MAX(Z_PK) FROM ZBINDER)+1, Z_ENT, 1, 0, 6, ZCREATEDAT, ZUPDATEDAT, 'pink', ZCOUNTRYCODE, 'Sam Costa', 'Sam', 'other', randomblob(16) FROM ZBINDER WHERE ZLABEL='Leo';
UPDATE Z_PRIMARYKEY SET Z_MAX=(SELECT MAX(Z_PK) FROM ZBINDER) WHERE Z_NAME='Binder';
COMMIT;
SQL
# One wallpaper per binder (device-only setting; the bible's house colours).
args=()
for row in ${(f)"$(sqlite3 "$DB" "select ZLABEL, hex(ZID) from ZBINDER")"}; do
  label=${row%%|*}; hex=${row##*|}
  uuid="${hex[1,8]}-${hex[9,12]}-${hex[13,16]}-${hex[17,20]}-${hex[21,32]}"
  case $label in
    Dad) w=mist;; Leo) w=seaGlass;; Mia) w=blush;; Maya) w=lavender;; Jonas) w=sage;; Biscuit) w=apricot;; Sam) w=dusk;; *) w=plain;;
  esac
  args+=("$uuid" "$w")
done
xcrun simctl spawn "$PHONE" defaults write "$BUNDLE" ob.wallpaper.binders -dict "${args[@]}"
sqlite3 "$DB" "select ZSORTORDER, ZLABEL, ZFULLNAME, ZCOLORRAW, ZPERSONTYPERAW, hex(ZID) from ZBINDER order by ZSORTORDER"
xcrun simctl spawn "$PHONE" defaults read "$BUNDLE" ob.wallpaper.binders
