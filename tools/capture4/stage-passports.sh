#!/bin/zsh
# stage-passports.sh : a passport each for Leo and Mia (staged family), copied from the sample's
# driver's-licence row (identity kind) in the local store: Leo's expires 2 Jul 2027, Mia's 14 Sep 2027.
# No numbers. The app adds the 9/6/3-month reminders itself.
source "${0:A:h}/env.sh"
xcrun simctl terminate "$PHONE" "$BUNDLE" 2>/dev/null; sleep 1
D=$(xcrun simctl get_app_container "$PHONE" "$BUNDLE" data) || exit 1
DB="$D/Library/Application Support/Binders.store"
ref() { python3 -c "import datetime as d;print((d.datetime($1,12)-d.datetime(2001,1,1)).total_seconds())"; }
COLS="Z_ENT,Z_OPT,ZISARCHIVED,ZREMINDERSENABLED,ZCREATEDAT,ZUPDATEDAT,ZKINDRAW,ZPACKETMARKSSTORAGE,ZREMINDEROFFSETSSTORAGE,ZTAGSSTORAGE"
add() {  # $1 binder label, $2 expiry ref date
  sqlite3 "$DB" "INSERT INTO ZDOCUMENT (Z_PK,ZBINDER,ZTITLE,ZTYPERAW,ZISSUER,ZEXPIRYDATE,ZID,$COLS)
    SELECT (SELECT MAX(Z_PK) FROM ZDOCUMENT)+1, (SELECT Z_PK FROM ZBINDER WHERE ZLABEL='$1'), 'Passport', 'passport', NULL, $2,
           randomblob(16), $COLS FROM ZDOCUMENT WHERE ZTYPERAW='driversLicense' LIMIT 1;
    UPDATE Z_PRIMARYKEY SET Z_MAX=(SELECT MAX(Z_PK) FROM ZDOCUMENT) WHERE Z_NAME='Document';" || exit 1
}
sqlite3 "$DB" "DELETE FROM ZDOCUMENT WHERE ZTYPERAW='passport' AND ZBINDER IN (SELECT Z_PK FROM ZBINDER WHERE ZLABEL IN ('Leo','Mia'))"
add Leo "$(ref 2027,7,2)"; add Mia "$(ref 2027,9,14)"
sqlite3 "$DB" "select b.ZLABEL, d.ZTITLE, d.ZEXPIRYDATE from ZDOCUMENT d join ZBINDER b on b.Z_PK=d.ZBINDER where d.ZTYPERAW='passport'"
