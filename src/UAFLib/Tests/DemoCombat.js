
Globals.SPECAB_HACKS = {};
Globals.SPECAB_HACKS["IsCombatReady"] = function (pkt) { Globals.debug("SPECAB_HACKS: IsCombatReady"); SPECAB.p_hook_parameters[0] = "1"; }  // This is to return 1 when COMBATANT.IsDone is called

/** Load item database */
var loader = new UAFLib.dataLoaders.ItemLoader();
var data = loader.load("C:\\Users\\Shadow\\Desktop\\uaf.git\\uaf-port\\src\\UAFLib\\data\\items.xml");
itemData.LoadFromLoader(data);

UnityEngine = importNamespace("UnityEngine");  // For Jint to access C# library
// Override the logging function for now because System.Console is not available in WebGL - should change to use Unity.Debug
//Globals.debug = function (msg) {
//    UnityEngine.Debug.Log(msg);
//}

UIEventManager.UpdateCombatMessage = function () {
    unityUAFEventManager.UpdateCombatMessage(DispText.CombatMsg);
}

UIEventManager.CombatantMoved = function (x, y, self, w, h) {
    var c = combatData.m_aCombatants[self];
    unityUAFEventManager.CombatantMoved(x, y, c.GetName(), c.GetHitPoints(), c.GetAdjAC(), c.GetNbrAttacks(), c.m_pCharacter.GetMaxMovement() - c.m_iMovement);
}

UIEventManager.StartAttack = function (attacker, attacked) {
    unityUAFEventManager.StartAttack(attacker, attacked);
}

UIEventManager.CombatantDying = function (id, x, y) {
    unityUAFEventManager.CombatantDying(id, x, y);
}

UIEventManager.CombatantDead = function (id, x, y) {
    unityUAFEventManager.CombatantDead(id, x, y);
}

function Deserialize(filename, debug) {
    var character = new CHARACTER();
    var path = "C:\\Users\\Shadow\\Desktop\\uaf.git\\uaf-port\\src\\UAFLib\\Tests\\" + filename;
    var fs = System.IO.File.OpenRead(path);
    var ar = new CAR(fs, 6.0);

    //Read the first 16 header bytes because this isn't covered in the CHARACTER's serialize method
    ar.readInt(); ar.readInt(); ar.readInt(); ar.readInt();

    if (debug) {
        ar.MFCSerializer.debug = true;
    }
    character.SerializeCAR(ar, 6.0);
    fs.Close();
    return character;
}

function loadLibraryStub() {
    loadRaces();
    loadAbilities();
    loadClasses();
    loadMonsters();
}

function loadRaces() {
    var data = new RACE_DATA();
    data.m_name = "Monster";
    raceData.AddRace(data);
}

function loadMonsters() {

    monsterData.MonsterData[0] = new MONSTER_DATA();
    monsterData.MonsterData[0].Name = "Kobold";
    monsterData.MonsterData[0].monsterID = "Kobold";
    monsterData.MonsterData[0].classID = "Fighter";
    //icon file = icon_Kobold.png, 0, 2, 48, 48, 0, 1, 2
    //miss sound = sound_Miss.wav
    //hit sound = sound_Hit.wav
    //move sound = sound_MonsterMoveStep.wav
    //death sound = sound_MonsterDeathMedium.wav
    monsterData.MonsterData[0].intelligence = 9;
    monsterData.MonsterData[0].Armor_Class = 10;
    monsterData.MonsterData[0].Movement = 6;
    monsterData.MonsterData[0].Hit_Dice = 0.500000;
    monsterData.MonsterData[0].UseHitDice = true;
    monsterData.MonsterData[0].Hit_Dice_Bonus = 0;
    monsterData.MonsterData[0].THAC0 = 20;
    monsterData.MonsterData[0].Magic_Resistance = 0;
    monsterData.MonsterData[0].Size = creatureSizeType.Medium;
    monsterData.MonsterData[0].Morale = 25;
    monsterData.MonsterData[0].XP_Value = 7;
    monsterData.MonsterData[0].m_type = MONSTER_TYPE;

    //Class = Fighter
    monsterData.MonsterData[0].Race = RACE_DATA_TYPE.Monster;
    /*form = none
    penalty = GnomeTHAC0 + RangerDmg
    immunity = none
    Misc Options = can be held / charmed
    item = Dagger
    item = Buckler
    attack = 4, 1, 0, attacks,
    Undead = none
    */

}

function loadClasses() {
    var data = new CLASS_DATA();
    data.m_name = "Fighter";
    data.m_baseclasses.baseclasses.push("fighter");
    classData.AddClass(data);

    data2 = new CLASS_DATA();
    data2.m_name = "Thief";
    data2.m_baseclasses.baseclasses.push("thief");
    classData.AddClass(data2);
}

function loadAbilities() {
    loadAbility("Strength");
    loadAbility("Intelligence");
    loadAbility("Wisdom");
    loadAbility("Dexterity");
    loadAbility("Charisma");
}

function loadAbility(abilityName) {
    var data = new ABILITY_DATA();
    data.m_name = abilityName;
    data.m_abbreviation = abilityName.substr(0, 3).toUpperCase();
    data.m_roll.m_Text = ""
    abilityData.AddAbility(data);
}

function packageCombatantStatus(c) {
    var data = [];
    data[0] = c.x;
    data[1] = c.y;
    data[2] = c.GetName();
    data[3] = c.GetHitPoints();
    data[4] = c.GetAdjAC();
    data[5] = c.GetNbrAttacks();
    data[6] = c.m_pCharacter.GetMaxMovement() - c.m_iMovement;
    return data;
}

function packageMapAndCombatantStatus(c) {

    var dataStr = "";
    var mapData = [];
    for (i = 0; i < Drawtile.MAX_TERRAIN_HEIGHT; i++) {
        mapData[i] = [];
        for (j = 0; j < Drawtile.MAX_TERRAIN_WIDTH; j++) {
            dataStr += Drawtile.terrain[i][j].tileIndex + ",";
            mapData[i][j] = Drawtile.terrain[i][j].tileIndex;
        }
        dataStr += "]\n";
    }


    //Globals.debug(dataStr);

    var data = [];
    data[0] = packageCombatantStatus(c);
    data[1] = mapData;
    return data;
}


function makeInventoryList(c) {
    var str = "";
    for (idx = 0; idx < c.m_pCharacter.myItems.m_items.GetCount(); idx++) {
        str += c.m_pCharacter.myItems.IsReady(idx) ? "*" : " ";
        str += c.m_pCharacter.myItems.GetItemIDByPos(idx) + "\n";
    }
    return str;
}

var Warrior = new CHARACTER();
Warrior.name = "Hardest_Ken"
Warrior.classID = "Fighter";
Warrior.SetStatus(charStatusType.Okay);
Warrior.hitPoints = 10;
Warrior.maxHitPoints = 20;
Warrior.maxMovement = 20;
Warrior.age = 20;
Warrior.maxAge = 100;
Warrior.alignment = 0;
Warrior.encumbrance = 10;
Warrior.maxEncumbrance = 1000;
Warrior.SetMaxMovement(2000);
var bcs = new BASECLASS_STATS();
bcs.currentLevel = 1;
bcs.baseclassID = "fighter";   // I think??
Warrior.baseclassStats.push(bcs);


var cWarrior = new COMBATANT();
cWarrior.m_pCharacter = Warrior;
cWarrior.self = 0;


//cWarrior.StartAttack(1);

loadLibraryStub();
//SPECAB.loadData(specialAbilitiesData, "C:\\Users\\Shadow\\Downloads\\Full_Release_191031\\TutorialDesign.dsn\\Data\\specialAbilities.dat");
Globals.logDebuggingInfo = true;

var combatEventData = new COMBAT_EVENT_DATA();
combatEventData.monsters = new MONSTER_EVENT_DATA();
var monsterEvent = new MONSTER_EVENT();
monsterEvent.UseQty = MONSTER_EVENT.meUseQty;
monsterEvent.UseQty = MONSTER_EVENT.meUsePercent;
monsterEvent.qtyDiceSides = 6;
monsterEvent.qtyDiceQty = 1;
monsterEvent.qtyBonus = 2;
monsterEvent.qty = 10;
monsterEvent.qty = 3;
monsterEvent.monsterID = "Kobold";
monsterEvent.m_type = MONSTER_TYPE;
combatEventData.distance = eventDistType.UpClose;
combatEventData.monsters.Add(monsterEvent);
//combatEventData.randomMonster = true;   // This seems to cause an NPE at Line 306 of COMBAT_DATA - "pSaveCharPointer is null"
combatEventData.UseQty = MONSTER_EVENT.meUsePercent;

var combatData = new COMBAT_DATA();    // This is pretty much the combat "map" and all data on it
party.Posx = 10;
party.Posy = 10;
globalData.SetMaxPCs(2);
globalData.SetMinPCs(2);
globalData.SetMaxPartySize(2);


party.addTempToParty(Warrior);
combatEventData.distance = eventDistType.UpClose;
combatEventData.m_UseOutdoorMap = false; // only outdoor stub is in place right now
combatEventData.direction = eventDirType.North;
combatData.InitCombatData(combatEventData);


cWarrior = combatData.m_aCombatants[0];

cWarrior.m_pCharacter.addCharacterItem("Long Sword", 1, 0, 0, 0);
cWarrior.m_pCharacter.addCharacterItem("Shield", 1, 0, 0, 0);
cWarrior.m_pCharacter.addCharacterItem("Chain Mail", 1, 0, 0, 0);
cWarrior.m_pCharacter.addCharacterItem("Dagger", 1, 0, 0, 0);
cWarrior.m_pCharacter.myItems.SetReady(1, itemReadiedLocation.ShieldHand);
cWarrior.m_pCharacter.myItems.SetReady(2, itemReadiedLocation.BodyArmor);
cWarrior.m_pCharacter.ReadyBestWpn(1, false);


Globals.debug("cWarrior.GetName(): " + cWarrior.GetName() + " / " + cWarrior.self + " / " + cWarrior.GetStatus());
Globals.debug("makeInventoryList(cWarrior): " + makeInventoryList(cWarrior));
consoleResults.payload = packageMapAndCombatantStatus(cWarrior);