#!/bin/zsh
# stage-sam-papers.sh : gives the staged "Sam" binder (stage-family.sh) two documents by copying the
# sample's vehicle-registration and deed rows in the local store (app not running): "Car registration"
# (expires 14 May 2027) and "Flat lease" (type lease, ends 31 Aug 2027). No numbers, notes or text.
source "${0:A:h}/env.sh"
xcrun simctl terminate "$PHONE" "$BUNDLE" 2>/dev/null; sleep 1
D=$(xcrun simctl get_app_container "$PHONE" "$BUNDLE" data) || exit 1
DB="$D/Library/Application Support/Binders.store"
ref() { python3 -c "import datetime as d;print((d.datetime($1,12)-d.datetime(2001,1,1)).total_seconds())"; }
CAR=$(ref 2027,5,14); LEASE=$(ref 2027,8,31)
COLS="Z_ENT,Z_OPT,ZISARCHIVED,ZREMINDERSENABLED,ZCREATEDAT,ZUPDATEDAT,ZKINDRAW,ZPACKETMARKSSTORAGE,ZREMINDEROFFSETSSTORAGE,ZTAGSSTORAGE"
sqlite3 "$DB" <<SQL || { echo "store edit failed" >&2; exit 1; }
BEGIN;
DELETE FROM ZDOCUMENT WHERE ZBINDER=(SELECT Z_PK FROM ZBINDER WHERE ZLABEL='Sam');
INSERT INTO ZDOCUMENT (Z_PK,ZBINDER,ZTITLE,ZTYPERAW,ZISSUER,ZEXPIRYDATE,ZID,$COLS)
  SELECT (SELECT MAX(Z_PK) FROM ZDOCUMENT)+1, (SELECT Z_PK FROM ZBINDER WHERE ZLABEL='Sam'), 'Car registration',
         'vehicleRegistration', NULL, $CAR, randomblob(16), $COLS FROM ZDOCUMENT WHERE ZTYPERAW='vehicleRegistration' LIMIT 1;
INSERT INTO ZDOCUMENT (Z_PK,ZBINDER,ZTITLE,ZTYPERAW,ZISSUER,ZEXPIRYDATE,ZID,$COLS)
  SELECT (SELECT MAX(Z_PK) FROM ZDOCUMENT)+1, (SELECT Z_PK FROM ZBINDER WHERE ZLABEL='Sam'), 'Flat lease',
         'lease', NULL, $LEASE, randomblob(16), $COLS FROM ZDOCUMENT WHERE ZTYPERAW='deed' LIMIT 1;
UPDATE Z_PRIMARYKEY SET Z_MAX=(SELECT MAX(Z_PK) FROM ZDOCUMENT) WHERE Z_NAME='Document';
COMMIT;
SQL
sqlite3 "$DB" "select ZTITLE,ZTYPERAW,ZKINDRAW,ZEXPIRYDATE from ZDOCUMENT where ZBINDER=(select Z_PK from ZBINDER where ZLABEL='Sam')"
