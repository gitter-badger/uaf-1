/** TODO **/
function COMBATANT() {
    this.self = 0;
    this.x = 0, this.y = 0;  // During creation x is the newMonsters index!
    this.hPath = 0;
    this.m_iInitiative = 0; //
    this.scriptPriority = 0;
    this.m_target = 0; // index of target
    this.targetValidity = 0; //-1=unknown; 0=notValid; 1=valid
    this.m_iFacing = 0;
    this.m_iMovement = 0;
    this.m_iMoveDir = 0;
    this.m_iNumDiagonalMoves = 0;  // In this round.
    this.moveX = 0;
    this.moveY = 0;
    this.lastAttackRound = 0;
    this.availAttacks = 0.0;  // double
    this.continueAttack = false; // interrupt a series of multiple attacks?
    this.iFleeingFlags = 0;  // See FLEEING_FLAGS
    this.iAutoFlags = 0;     // See AUTO_FLAGS
    this.isTurned =  false;  // this guy has been turned and is fleeing from the cleric that did it
    this.hasTurnedUndead = false; // only get to turn undead once per combat
    this.m_iLastAttacker = 0; // who tried to hit us most recently?
    this.m_iLastAttacked = 0; // who did we try to hit most recently?
    this.m_eLastAction = 0; // PORT NOTE:  enum type - setting to default of 0
    this.turnIsDone = false;
    this.isBandaged = false;
    this.bandageWho = 0;
    this.didMove = false;
    this.m_ICS = 0; // PORT NOTE:  enum type - setting to default of 0
    this.friendly = false;
    this.m_adjFriendly = 0; // 0=leave alone; 1=friendly; 2=not friendly; 3=toggle friendly
    this.blitDeathTile = 0;
    this.m_spellIDBeingCast = "";
    this.m_secondarySpellIDBeingCast = "";
    this.m_itemSpellIDBeingCast = "";
    this.Wpn_Type = 0; // Not serializedUsed during item spell casting process. // PORT NOTE:  enum type - setting to default of 0
    this.width = 0;
    this.height = 0;
    this.targetPos = 0;  // PORT NOTE:  POSITION, but that is really just a list index
    this.origKey = 0;
    this.combatant_pendingSpellKey = 0;
    this.combatant_activeSpellKey = 0; // -1 in idle state
    this.combatant_spellCastingLevel = 0; //level at which combatant_activeSpellKey was cast
    this.forceAttackPose = false;
    this.m_isCombatReady = 0;
    this.m_spellDamageHP = 0;
    // *******************************
    this.m_useTempHP = false; // During combat spell processing adjustments are made here
    this.m_tempHP = 0;     // rather than to the character's HP.  At the end of spell
    // processing, we transfer the temp value to the character.
    // *******************************
    this.m_specialActionName = "";
    this.m_specialActionIndex = 0;

    if (this.m_pCharacter != null) {
        Globals.die(0xffd21c);
    };
    this.combatantSA = new SPECIAL_ABILITIES();
    this.combatantSA.Clear();
    this.combattargets = new OrderedQueue();
    this.m_preCombatMorale = 0;
    this.targeters = new CList();
    this.Clear();

    this.CombatantStateText = ["ICS_None",
        "ICS_Casting",
        "ICS_Attacking",
        "ICS_Guarding",
        "ICS_Bandaging",
        "ICS_Using",
        "ICS_Moving",
        "ICS_Turning",
        "ICS_Fleeing",
        "ICS_Fled",
        "ICS_ContinueGuarding",
        "ICS_Petrified"
        ];
}

COMBATANT.prototype.Clear = function () {
    this.m_pCharacter = null;
    this.m_useTempHP = false;
    this.deleteChar = false;
    this.self = -1;
    this.x = -1; this.y = -1;
    this.hPath = -1;
    this.m_iInitiative = 0;
    this.m_target = -1;
    this.targetValidity = -1;
    this.m_iFacing = 0;
    this.m_iMoveDir = 0;
    this.m_iMovement = 0;
    this.m_iNumDiagonalMoves = 0;
    this.moveX = -1; moveY = -1;
    this.lastAttackRound = 0;
    this.availAttacks = 0.0;
    this.continueAttack = false;
    this.turnIsDone = false;
    this.isBandaged = false;
    this.bandageWho = -1;
    this.origKey = -1;
    this.didMove = false;
    this.State(individualCombatantState.ICS_None);
    this.friendly = true;
    this.m_adjFriendly = 0;  // No adjustment
    this.blitDeathTile = false;
    this.width = 0; this.height = 0;
    this.targetPos = null;
    this.iFleeingFlags = 0;
    this.isTurned = false;
    this.hasTurnedUndead = false;
    this.m_iLastAttacker = -1;
    this.m_iLastAttacked = -1;
    this.m_eLastAction = LASTACTION.LA_None;
    this.RemoveAllTargets();
    this.targeters = [];
    this.m_spellIDBeingCast = "";
    this.m_itemSpellIDBeingCast = "";
    this.Wpn_Type = weaponClassType.NotWeapon;
    this.combatant_pendingSpellKey = -1;
    this.combatant_activeSpellKey = -1;
    this.combatant_spellCastingLevel = -1;
    this.forceAttackPose = false;
    this.m_isCombatReady = -1;
    this.m_specialActionName = "";
    this.m_specialActionIndex = -1;
    this.combatantSA = new SPECIAL_ABILITIES();
    this.combatantSA.InsertAbility("Competing", "", "Combatant Constructor ", "");
}

COMBATANT.prototype.GetName = function () {
    return this.m_pCharacter.GetName();
}

COMBATANT.prototype.State = function (ICS) {
    if (ICS == null || ICS == undefined) {          // PORT NOTE:  Handling overloaded name of accessor/mutator
        return this.m_ICS;
    }
    if (this.m_pCharacter != null) {
        //WriteDebugString("DEBUG - COMBATANT(%s)::State(%d)\n", m_pCharacter->GetName(),ICS);
    };
    if ((this.m_ICS != individualCombatantState.ICS_Guarding) && (ICS == individualCombatantState.ICS_Guarding)) {
        this.EnterGuardingState();
    };
/*
#ifdef TraceFreeAttacks
    if (((m_ICS == ICS_Guarding)
        || (m_ICS == ICS_ContinueGuarding)
        || (ICS == ICS_Guarding)
        || (ICS == ICS_ContinueGuarding)
    )
        && (m_ICS != ICS)
    ) {
        WriteDebugString("TFA - %s enters state %s\n", GetName(), CombatantStateText[ICS]);
    };
#endif */
    this.m_ICS = ICS;
}

COMBATANT.prototype.EnterGuardingState = function () {
    var hookParameters = new HOOK_PARAMETERS();
    var scriptContext = new SCRIPT_CONTEXT();
    scriptContext.SetCombatantContext(this);
    this.RunCombatantScripts(SPECAB.GUARDING_GUARD,
        SPECAB.ScriptCallback_RunAllScripts,
        null,
        "Combatant entering guarding state");
}

COMBATANT.prototype.RunCombatantScripts = function (scriptName, fnc, pkt, comment) {
        return this.combatantSA.RunScripts(scriptName,
            fnc,
            pkt,
            comment,
            SCRIPT_SOURCE_TYPE.ScriptSourceType_Combatant,
//#ifdef newCombatant                           // PORT NOTE: Don't know which to choose
            this.GetName()
//#else
//name
//#endif
            );
};

COMBATANT.prototype.RemoveAllTargets = function () {
    this.combattargets.RemoveAll();
    this.SetCurrTarget();
}

COMBATANT.prototype.SetCurrTarget = function () {
    if (!this.combattargets.IsEmpty()) {
        this.targetPos = this.combattargets.GetHeadPosition();
        this.SetTarget(this.combattargets.GetAtPos(this.targetPos));
    }
    else {
        this.SetTarget(NO_DUDE);
        this.targetPos = null;
    }
}

COMBATANT.prototype.SetTarget = function (t) {
    this.m_target = t; this.targetValidity = -1;
} //Not yet checked


COMBATANT.prototype.StartAttack = function(targ, additionalAttacks) {
    Globals.ASSERT(this.self != NO_DUDE, "Combatant.js::StartAttack");
    this.continueAttack = false;
    if (targ == NO_DUDE) {
        Globals.die(0xab4c5);
        Globals.WriteDebugString("StartAttack() for " + self + " called with invalid target\n");
        return false;
    }
    if (this.availAttacks + this.additionalAttacks <= 0) {
        Globals.die(0xab4c6);
        Globals.WriteDebugString("StartAttack() for " + self + " called with availAttacks=0\n");
        return false;
    }
    if (!this.charOnCombatMap(false, true)) {
        Globals.die(0xab4c7);
        Globals.WriteDebugString("StartAttack() for " + self + " called when combatant not on map\n",);
        return false;
    }
    {
        var pTarget;
        pTarget = Globals.GetCombatantPtr(targ);

        if (!pTarget.charOnCombatMap(false, true)) {
            return false;
        };
    };
    this.State(individualCombatantState.ICS_Attacking);
    this.StopCasting(false, false);
    Drawtile.EnsureVisibleTargetTargetForceCenter(targ, false);   // PORT NOTE:  Only one parameter provided in this call.  I guess C++ provides default parmeter values, idk
    this.continueAttack = true;
    UIEventManager.StartAttack(this.self, targ);
    return true;
}

COMBATANT.prototype.InitFromCharData = function(dude) {
    if (this.m_pCharacter != null) {
        Globals.die(0x6659c);
    }
    this.m_pCharacter = party.characters[dude];
    if (this.m_pCharacter.m_pCombatant != null) {
        Globals.die(0x5cbff);
    };
    this.m_pCharacter.m_pCombatant = this;
    this.m_preCombatMorale = this.m_pCharacter.GetMorale();

    this.SetPartyMember(true);
    this.State(individualCombatantState.ICS_None);
    origKey = dude;
    this.m_iMovement = 0;
    this.m_iNumDiagonalMoves = 0;

    this.friendly = true;
    this.m_adjFriendly = 0;
    // NPC in party cannot be controlled in combat unless it is a 
    // pre-generated character
    //20140915 PRS SetAllowPlayerControl( (GetType()==CHAR_TYPE) || (m_pCharacter->IsPreGen) );
    this.SetAllowPlayerControl(true);
    this.m_iFacing = this.DetermineInitialFacing(party.facing);
    this.m_iMoveDir = this.m_iFacing;
    Globals.debug();
    this.determineNbrAttacks(); // lookup max possible defaults
    if (this.GetAdjAutomatic()) {
        this.ReadyBestArmor();
        this.ReadyBestWpn(NO_DUDE);
        this.ReadyBestShield();
    }
    this.determineNbrAttacks();
    this.determineAvailAttacks(this.GetNbrAttacks()); // now take ready wpn into account
    //WriteDebugString("add 2: origIndex %i, origKey %i\n", origIndex, origKey);
}

COMBATANT.prototype.SetPartyMember = function (flag) {
    if (flag == null || flag == undefined) { flag = true; }
    this.m_pCharacter.SetPartyMember(flag);
}

COMBATANT.prototype.SetAllowPlayerControl = function (flag) {
    this.m_pCharacter.SetAllowPlayerControl(flag);
}

COMBATANT.prototype.determineNbrAttacks = function () {
    return this.m_pCharacter.determineNbrAttacks();
}

COMBATANT.prototype.determineAvailAttacks = function (numberOfAttacks) {
    this.availAttacks = numberOfAttacks;

    /** //PORT NOTE:  Nah not worth it for the debug message
    var temp = availAttacks;
    var t = timeGetTime();
    TRACE("%d determineAvailAttacks\n", t);
    TRACE("Setting availAttacks for %i to %f\n", self, temp);   
    */
}

COMBATANT.prototype.DetermineInitialFacing = function(PartyFacing) {
    switch (PartyFacing) {
        case FACE_NORTH:
        case FACE_SOUTH:
            if (Globals.RollDice(100, 1, 0) <= 50)
                return FACE_EAST;
            else
                return FACE_WEST;

        case FACE_EAST:
            return FACE_EAST;
        case FACE_WEST:
            return FACE_WEST;
    }
    return FACE_EAST;
}

COMBATANT.prototype.GetContextActor = function() {
    var pActor = new ActorType();
    pActor.Clear();

    if (this.IsPartyMember()) {
        pActor.SetCombatPartySrc(this.friendly);
    }
    else {
        if (this.GetType() == MONSTER_TYPE)
            pActor.SetCombatMonsterSrc(this.friendly);
        else if (this.GetType() == NPC_TYPE)
            pActor.SetCombatNPCSrc(this.friendly);
        //#ifdef newCombatantx                            // PORT NOTE: ????
        else
            Globals.die(0xea667);
        //#endif
    }
    return pActor;
}

COMBATANT.prototype.IsPartyMember = function()  {
    return this.m_pCharacter.IsPartyMember();
}

COMBATANT.prototype.GetAdjAutomatic = function (flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjAutomatic(flags);
}

COMBATANT.prototype.GetNbrAttacks = function () {
    return this.m_pCharacter.GetNbrAttacks();
}

COMBATANT.prototype.LoadCombatIcon = function () {
   /**TODO**/
}

COMBATANT.prototype.determineIconSize = function () {
    this.width = 1;
    this.height = 1;
    /**TODO:  They use the size of the image here to determine and set the grid width/height of the combatant 
     * Hmmm... Not sure what I want to do with this yet given the goal of decoupling
     * from the graphics code.  Stub for now.

      * var w = 0, h = 0, bits = 0;
//#ifdef newCombatant            // PORT NOTE: I think this is on
    if (GraphicsMgr.GetSpriteSurfaceStats(m_pCharacter -> icon.key, w, h, bits))
//#else
//    if (GraphicsMgr.GetSpriteSurfaceStats(icon.key, w, h, bits))
//#endif
    {
        int imagewidth = w; // pixel width

        // (width / frame_width) / 2_frames_per_icon
        w = (w / COMBAT_TILE_WIDTH) / 2;

        // 2 frame minimum (one of each pose, rdy/attack)
        // frame count is multiple of 2
        // the icon frame pair used is indicated by iconIndex
        // adjust for number of frames in icon
        //#ifdef newCombatant
        w /= (m_pCharacter -> icon.NumFrames / 2);
        //#else
        //        w /= (icon.NumFrames / 2);
        //#endif

        h = h / COMBAT_TILE_HEIGHT;

        if (w < 1) w = 1;
        if (h < 1) h = 1;

        width = w;
        height = h;
        //#ifdef newCombatant
        int offset = (m_pCharacter -> iconIndex - 1) * ((width * COMBAT_TILE_WIDTH) * 2);
        if ((offset + (width * COMBAT_TILE_WIDTH)) >= (imagewidth - width))
            m_pCharacter -> iconIndex=1;
        //#else
        //        int offset = (iconIndex - 1) * ((width * COMBAT_TILE_WIDTH) * 2);
        //        if ((offset + (width * COMBAT_TILE_WIDTH)) >= (imagewidth - width))
        //            iconIndex = 1;
        //#endif
    }
  else
    //#ifdef newCombatant
    m_pCharacter -> icon.FreePic();
    //#else
    //    icon.FreePic();
    //#endif}
    */
}

COMBATANT.prototype.GetIsFriendly = function () {
    if (this.m_adjFriendly == 0) return this.friendly;
    if (this.m_adjFriendly == 1) return true;
    if (this.m_adjFriendly == 2) return false;
    return !this.friendly;
}

COMBATANT.prototype.GetCenterX = function() {
    if (this.width <= 1) return this.x;
    if (this.m_iFacing == FACE_WEST)
        return (this.x + (this.width / 2) - 1);
    else
        return (this.x + (this.width / 2));
}

COMBATANT.prototype.GetCenterY = function() {
    if (this.height <= 1) return this.y;
    return (this.y + (this.height / 2) - 1);
}

COMBATANT.prototype.OnEnsureVisible = function() {
    Globals.TRACE("OnEnsureVisible for " + this.self + "\n", );
}

COMBATANT.prototype.SetType = function(flag) {
    this.m_pCharacter.SetType(flag);
}


COMBATANT.prototype.InitFromMonsterDataID = function (monsterID, IsFriendly, items, msack) {
    var pMonster;
    pMonster = monsterData.PeekMonster(monsterData.LocateMonster(monsterID));
    Globals.TRACE(Globals.timeGetTime() + " Afet PeekMonster\n");
    if (pMonster == null) {
        Globals.WriteDebugString("Cannot find data for monster " + monsterID + "\n");
        pMonster = monsterData.PeekMonster(0);
        if (pMonster == null) {
            Globals.WriteDebugString("Combat with no monsters defined");
            Globals.die(0x45acb);
        };
    }
    this.InitFromMonsterDataMonster(pMonster, IsFriendly, items, msack);
}


COMBATANT.prototype.InitFromMonsterDataMonster = function (pMonster, IsFriendly, items, msack) {
    if (this.m_pCharacter != null) {
        Globals.die(0xc33bd);
    }
    this.m_pCharacter = new CHARACTER();
    this.m_pCharacter.m_pCombatant = this;  // Link the character and combatant one to another.
    this.deleteChar = true;
    this.State(individualCombatantState.ICS_None);
    if (pMonster == null) {
        Globals.WriteDebugString("Bogus monster index in InitFromMonsterData()\n");
        this.Clear();
        this.origKey = NO_DUDE;
        return;
    }

    this.SetPartyMember(false);
    this.SetType(MONSTER_TYPE);
    this.m_pCharacter.monsterID = pMonster.MonsterID();

    this.origKey = monsterData.LocateMonster(this.m_pCharacter.monsterID);
    this.m_pCharacter.classID = pMonster.classID;
    this.m_pCharacter.race = pMonster.raceID;
    this.friendly = IsFriendly;
    this.m_adjFriendly = 0;

    this.generateNewCharacter(pMonster.XP_Value, Globals.START_EXP_VALUE); // determines monster AC,THAC0,Hit Points,etc

    Globals.TRACE(Globals.timeGetTime() + " After generateNewCharacter\n");
    this.SetStatus(charStatusType.Okay);
    this.SetAllowPlayerControl(Globals.GetConfigMonsterPlyrControl());
    this.m_pCharacter.SetName(pMonster.Name);
    this.m_pCharacter.SetPermInt(pMonster.Intelligence);
    this.m_pCharacter.SetMagicResistance(pMonster.Magic_Resistance);
    this.m_pCharacter.SetSize(pMonster.Size);
    this.SetMorale(pMonster.Morale);
    this.m_pCharacter.SetUndead(pMonster.undeadType);

    // items specified in combat event for this monster
    this.m_pCharacter.myItems = items;

    // default monster items in monster database
    var pos = pMonster.myItems.GetHeadPosition();
    while (pos != null) {
        this.m_pCharacter.myItems.AddItem(pMonster.myItems.GetNext(pos));
    }

    this.m_pCharacter.money = msack; // combat additional money
    this.m_pCharacter.money.AddMoneySack(pMonster.money); // monster default money

    this.m_pCharacter.icon = pMonster.Icon;

    if (false)  // This was done in generateNewCharacter
    {
        this.determineNbrAttacks();
    };

    this.ReadyBestArmor();
    this.ReadyBestWpn(NO_DUDE);
    this.ReadyBestShield();
    this.determineNbrAttacks(); // Take armor and such into account.
    this.determineAvailAttacks(this.GetNbrAttacks());
    this.determineMaxMovement();

    if (Globals.GetConfigMonsterNoMove()) {
        this.SetMaxMovement(0);
        this.m_iMovement = 0;
        this.m_iNumDiagonalMoves = 0;
    }

    Globals.ASSERT(this.GetAdjHitPoints() > 0, "this.GetAdjHitPoints() > 0");

    {
        var hookParameters = new HOOK_PARAMETERS();
        var scriptContext = new SCRIPT_CONTEXT();
        scriptContext.SetCharacterContext(this.m_pCharacter);
        scriptContext.SetMonsterTypeContext(pMonster);
        SPECAB.RunGlobalScript("Global_CreateMonsterCombatant", SPECAB.CREATE_MONSTER_COMBATANT, true);
        pMonster.RunMonsterScripts(
            SPECAB.CREATE_MONSTER_COMBATANT,
            SPECAB.ScriptCallback_RunAllScripts,
            null,
            "Initializing monster for combat");
    }
}

/*  Questionable */   //PORT NOTE:  Comment copied from original source
COMBATANT.prototype.generateNewCharacter = function(StartExperience, StartExpType) {
    this.m_pCharacter.generateNewCharacter(StartExperience, StartExpType);
}

COMBATANT.prototype.GetType = function () {
    return this.m_pCharacter.GetType();
}

COMBATANT.prototype.SetStatus = function(val) {
    this.m_pCharacter.SetStatus(val);
}

COMBATANT.prototype.SetMorale = function (val) {
    this.m_pCharacter.SetMorale(val);
}


COMBATANT.prototype.ReadyBestArmor = function () {
    this.m_pCharacter.ReadyBestArmor();
};

COMBATANT.prototype.ReadyBestWpn = function(targ) {
    var isLargeTarget = false;
    var dist = 1;

    // get distance to target
    if (targ == NO_DUDE) {
        // no combat targets, nobody to shoot at, so just ready 
        // a hand-to-hand weapon
        dist = 1;
        isLargeTarget = false;
    }
    else {
        var targCOMBATANT;
        targCOMBATANT = Globals.GetCombatantPtr(targ);
        Globals.ASSERT(targCOMBATANT != null, "targCOMBATANT != null");
        if (targCOMBATANT != null) {
            isLargeTarget = targCOMBATANT.isLargeDude();
            dist = Drawtile.Distance6(this.self, this.x, this.y,
                targCOMBATANT.self, targCOMBATANT.x, targCOMBATANT.y);
        }
    }
    this.m_pCharacter.ReadyBestWpn(dist, isLargeTarget);

    // if target is distant but don't have distance weapon
    // then ready hand-to-hand weapon
    if ((dist > 1) && (this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0) == NO_READY_ITEM))
        this.m_pCharacter.ReadyBestWpn(1, isLargeTarget);
}

COMBATANT.prototype.ReadyBestShield = function () {
    return this.m_pCharacter.ReadyBestShield();
};

COMBATANT.prototype.determineMaxMovement = function () {
    return this.m_pCharacter.determineMaxMovement();
};

COMBATANT.prototype.GetAdjHitPoints = function (flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjHitPoints(flags);
};

COMBATANT.prototype.GetMorale = function () {
    return this.m_pCharacter.GetMorale();
}

COMBATANT.prototype.MoveCombatant = function(newX, newY, allowZeroMoveAttack) {

    var dude = 0;
    var isUpdate = false;
    var moveData = new MOVE_DATA();
    // if already at destination
    if ((newX == this.x) && (newY == this.y))
        return false;

    if (this.GetType() == MONSTER_TYPE) {
        if (Globals.GetConfigMonsterNoMove())
            return false;
    }
    moveData.combatantIndex = this.self;
    moveData.oldX = this.x;
    moveData.oldY = this.y;
    moveData.newX = this.newX;
    moveData.newY = this.newY;

    var dir = PATH_DIR.GetDir(this.x, this.y, this.newX, this.newY);
    var movePoints = PATH_DIR.GetDist(dir);  // Returns 1 (orthogonal) or 2 (diagonal)
    if (movePoints == 2) {
        this.m_iNumDiagonalMoves++;
        if ((this.m_iNumDiagonalMoves & 1) == 0) movePoints = 1;
    };
    this.FaceDirection(dir);

    dude = NO_DUDE;
    if (Drawtile.coordsOnMap(newX, newY, this.width, this.height)) {
        dude = Drawtile.getCombatantInCell(newX, newY, this.width, this.height, this.self);
    };

    if (((dude != NO_DUDE) && (allowZeroMoveAttack))
        || (this.m_iMovement < this.GetAdjMaxMovement(DEFAULT_SPELL_EFFECT_FLAGS, "Move Combatant") - (movePoints - 1))
    ) {
        if (Drawtile.coordsOnMap(newX, newY, this.width, this.height)) {
            if (dude != NO_DUDE) {
                if (this.canAttack(dude, -1, -1, 0, Drawtile.Distance6, false)) {
                    this.RemoveAllTargets();
                    this.AddTarget(dude, false);
                    this.StartAttack(dude, 0);
                    //          WriteDebugString("DEBUG - Return to MoveCombatant");
                    isUpdate = true;
                }
            }
            // check for walls and such
            else if (OBSTICAL_TYPE.OBSTICAL_none == Drawtile.ObsticalType(newX, newY, this.width, this.height, false, true, this)) {
                // if moving away from an enemy that has no target,
                // the enemy gets to make an attack at this dude's
                // retreating backside.
                var oldX = 0, oldY = 0;

                this.PlayCombatMove();
                this.m_iMovement += movePoints;

                // remove dude from old location
                Drawtile.placeCombatant(this.x, this.y, NO_DUDE, this.width, this.height);

                Globals.TRACE("MoveCombatant() from " + this.x + "," + this.y + " to " + newX + "," + newY + "\n");

                if ((Math.abs(newX - this.x) > 1) || (Math.abs(newY - this.y) > 1))
                    Globals.TRACE("Moving more than 1 square\n");

                // place dude at new location
                Drawtile.placeCombatant(newX, newY, this.self, this.width, this.height);

                oldX = this.x;
                oldY = this.y;
                this.x = newX;
                this.y = newY;

                UIEventManager.CombatantMoved(newX, newY, this.self, this.width, this.height);

                if (this.CheckOpponentFreeAttack(oldX, oldY, newX, newY)) {
          // This guys turn isn't over, but once the free
          // attacks are over, he will not start out in CS_Move.
//#ifdef D20140707      // PORT NOTE:   Doesn't seem to be any difference
//                    State(ICS_None);  // Should we skip this if OnAuto()?
//#else
                    this.State(individualCombatantState.ICS_None);
//#endif
                }

                {
                    var actor = new ActorType();
                    var hookParameters = new HOOK_PARAMETERS();
                    var scriptContext = new SCRIPT_CONTEXT();
                    actor = this.GetContextActor();

                    RunTimeIF.SetCharContext(actor);

                    scriptContext.SetCombatantContext(this);
                    this.RunCombatantScripts(
                        SPECAB.ON_STEP,
                        SPECAB.ScriptCallback_LookForChar,
                        "F",
                        "Move Combatant");
                    RunTimeIF.ClearCharContext();
                };

                if (activeSpellList.LingerSpellAffectsTarget(this.self, this.x, this.y, this.width, this.height)) {
                    // A lingering spell is active at the location 
                    // just moved to. 
                    Globals.TRACE(this.self + " moved into at least one active linger spell at location " + this.x + "," + this.y + "\n");

                    activeSpellList.ActivateLingerSpellsOnTarget(this.self, this.x, this.y, this.width, this.height);
                }

                isUpdate = true;
            }
        }
        else {
            isUpdate = true;
            // dude fled map
            this.SetStatus(charStatusType.Fled);
            if (this.friendly)
                Globals.IncNumFriendFlee(); //combatData.numFrndFlee++;
            else
                Globals.IncNumMonsterFlee(); //combatData.numMonFlee++;
            this.EndTurn();
        }
    }

    if ((isUpdate) && (this.charOnCombatMap(false, true))) {
        Drawtile.ForceMapToMoveAlong(this.x, this.y, dir, Math.max(this.width, this.height));
        Globals.PlaceCursorOnCurrentDude();
    }
    combatData.CheckAllAuraPlacements(moveData);
    return isUpdate;
}

COMBATANT.prototype.GetCurrentLevel = function (baseclassID) {
    return this.m_pCharacter.GetCurrentLevel(baseclassID);
}

COMBATANT.prototype.race = function () {
    return this.m_pCharacter.race;
}

COMBATANT.prototype.GetClass = function () {
    return this.m_pCharacter.GetClass();
}

COMBATANT.prototype.CanCastSpells = function () {
    return this.m_pCharacter.CanCastSpells();
}

COMBATANT.prototype.FetchCharacterSpell = function (spellID, pCharSp) {
    return this.m_pCharacter.FetchCharacterSpell(spellID, pCharSp);
}

COMBATANT.prototype.ListShields = function (pcsc) {
    this.m_pCharacter.ListShields(pcsc);
}

COMBATANT.prototype.EvalDiceAsClass = function (dice, baseclassID, pRollerLevel) {
    return this.m_pCharacter.EvalDiceAsClass(dice, baseclassID, pRollerLevel);
}

COMBATANT.prototype.EvalDiceAsClass = function (dice, schoolID, spellLevel, pRollerLevel) {
    return this.m_pCharacter.EvalDiceAsClass(dice, schoolID, spellLevel, pRollerLevel);
}

COMBATANT.prototype.GetStatus = function () {
    return this.m_pCharacter.GetStatus();
}

COMBATANT.prototype.UpdateSpellForAttacks = function (AttacksTaken) {
    this.m_pCharacter.UpdateSpellForAttacks(AttacksTaken);
}

COMBATANT.prototype.SetEncumbrance = function (val) {
    this.m_pCharacter.SetEncumbrance(val);
}

COMBATANT.prototype.determineEffectiveEncumbrance = function () {
    return this.m_pCharacter.determineEffectiveEncumbrance();
}

COMBATANT.prototype.GetAutomatic = function() {
    return this.m_pCharacter.GetAutomatic()
};

COMBATANT.prototype.SetAutomatic = function(flag) {
    this.m_pCharacter.SetAutomatic(flag);
}

COMBATANT.prototype.GetCurrentLevel  = function(baseclassID) {
    return this.m_pCharacter.GetCurrentLevel(baseclassID);
}

COMBATANT.prototype.race = function () {
    return this.m_pCharacter.race;
}

COMBATANT.prototype.GetClass = function () {
    return this.m_pCharacter.GetClass();
}

COMBATANT.prototype.CanCastSpells = function () {
    return this.m_pCharacter.CanCastSpells();
};

COMBATANT.prototype.FetchCharacterSpell = function(spellID, pCharSp) {
    return this.m_pCharacter.FetchCharacterSpell(spellID, pCharSp);
};

COMBATANT.prototype.FaceDirection = function(dir) {
    // translate attacker direction into
    // east/west icon facing
    switch (dir) {
        case PATH_DIR.PathNW:
            this.m_iMoveDir = FACE_NW;
            this.m_iFacing = FACE_WEST;
            break;
        case PATH_DIR.PathWest:
            this.m_iMoveDir = FACE_WEST;
            this.m_iFacing = FACE_WEST;
            break;
        case PATH_DIR.PathSW:
            this.m_iMoveDir = FACE_SW;
            this.m_iFacing = FACE_WEST;
            break;
        case PATH_DIR.PathNE:
            this.m_iMoveDir = FACE_NE;
            this.m_iFacing = FACE_EAST;
            break;
        case PATH_DIR.PathEast:
            this.m_iMoveDir = FACE_EAST;
            this.m_iFacing = FACE_EAST;
            break;
        case PATH_DIR.PathSE:
            this.m_iMoveDir = FACE_SE;
            this.m_iFacing = FACE_EAST;
            break;

        default:
            // if north/south attacker, no need to change facing.
            break;
    }
}

COMBATANT.prototype.GetAdjMaxMovement = function (flags, comment) {
    return this.m_pCharacter.GetAdjMaxMovement(flags, comment);
}

COMBATANT.prototype.PlayCombatMove = function() {
    if (this.GetType() == MONSTER_TYPE)
        monsterData.PlayMove(this.m_pCharacter.monsterID);
    else
        Globals.PlayCombatMove(); //combatData.PlayCombatMove();
}

COMBATANT.prototype.charOnCombatMap = function(unconsciousOK, petrifiedOK) {
    var stype = this.GetAdjStatus();
    if ((this.charUnconscious() && !unconsciousOK)
        || (this.charPetrified() && !petrifiedOK)
        || (stype == charStatusType.Fled)
        || (stype == charStatusType.Gone)
        || (stype == charStatusType.TempGone)
        || (stype == charStatusType.Dead))
        return false;

    return true;
}

COMBATANT.prototype.GetAdjStatus = function (flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS };
    return this.m_pCharacter.GetAdjStatus(flags);
}

COMBATANT.prototype.charUnconscious = function() {
    var stype = this.GetAdjStatus();
    if ((stype == charStatusType.Dying) || (stype == charStatusType.Unconscious)) return true;
    return false;
}

COMBATANT.prototype.charPetrified = function() {
    var stype = this.GetAdjStatus();
    if (stype == charStatusType.Petrified) return true;
    return false;
}


COMBATANT.prototype.AttacksRemaining = function () {
    return this.availAttacks;
}

COMBATANT.prototype.OnAuto = function (callAutoActionHook) {
    // We want to call the hook only at those points in
    // the combat where it makes sense for 'auto action' to have changed.
    // Otherwise we call the hook hundreds of times (for example from OnIdle).

    if (callAutoActionHook) {
        var actor;
        var hookParameters = new HOOK_PARAMETERS();
        var scriptContext = new SCRIPT_CONTEXT();
        this.GetContextActor();
        RunTimeIF.SetCharContext(actor);
        scriptContext.SetCombatantContext(this);

//#ifdef newCombatant                   // PORT NOTE:   I think this is on
        RunCombatantScripts(SPECAB.AUTO_ACTION,
            SPECAB.ScriptCallback_RunAllScripts,
            null,
            "Combatant Auto-action may have changed");
//#else
//        combatantSA.RunScripts(AUTO_ACTION, ScriptCallback_RunAllScripts, NULL, "OnAuto", name);
//#endif
        RunTimeIF.ClearCharContext();
        //if (hookParameters[0].IsEmpty()) return FALSE;




        while (!UAFUtil.IsEmpty(hookParameters[0])) {
            var col = 0;
            this.iFleeingFlags &= ~FLEEING_FLAGS.fleeAutoActionScript;
            this.iAutoFlags &= ~FLEEING_FLAGS.forceAutoScript;
            this.iAutoFlags &= ~FLEEING_FLAGS.forcePlayerScript;
            switch (hookParameters[0][0]) {
                case 'F':
                    // We probably need to clear 'fleeAutoActionScript' when we 'GetNextCombatant'
                    // so that the fleeing can be terminated when a spell effect ends.
                    this.iFleeingFlags |= FLEEING_FLAGS.fleeAutoActionScript;
                    if (hookParameters[0].GetLength() > 1) {
                        var attacker = 0;
                        /** TODO - i have to be real careful about what (LPCSTR)hookParameters[0] + 1 is.  +1 to a pointer to a character string?
                        if (sscanf((LPCSTR)hookParameters[0] + 1, "%d", & attacker) == 1) {
                            if ((attacker >= 0) && (attacker < combatData.NumCombatants())) {
                                if (attacker != this -> self) {
                                    this.m_iLastAttacker = attacker;
                                };
                            };
                        }; **/
                    };
                    break;
                case 'C':
                    if (hookParameters[0].GetLength() > 1) {
                        if (hookParameters[0][1] == 'P') iAutoFlags |= forcePlayerScript;
                        if (hookParameters[0][1] == 'A') iAutoFlags |= forceAutoScript;
                    };
                    break;
            };
            col = hookParameters[0].Find(',');
            if (col < 0) hookParameters[0] = "";
            else hookParameters[0] = hookParameters[0].Right(hookParameters[0].GetLength() - col);
        };
    };


    if (this.iFleeingFlags != 0) return true;
    if (this.iAutoFlags & FLEEING_FLAGS.forceAutoScript) return true;
    if (this.iAutoFlags & FLEEING_FLAGS.forcePlayerScript) return false;

    if ((this.friendly && (this.m_adjFriendly == 2))
        || (this.m_adjFriendly == 3)
    ) {
        return true;
    };


    if (this.GetAdjAutomatic()) {
        return true;
    };

    return false;

}


/*
 * 
 *

struct COMBATANT //: public CHARACTER
{
void ComputeCombatViewValues(void);
/* Here we put functions that are needed to access the
 * underlying character.  We used to derive COMBATANT 
 * from character and so the character variables were
 * directly exposed.  Now we need to access them via
 * the m_pCharacter pointer.
 * /
inline void ListShields(COMBAT_SUMMARY_COMBATANT * pcsc){ m_pCharacter -> ListShields(pcsc); };
inline double EvalDiceAsClass(DICEPLUS & dice, const BASECLASS_ID& baseclassID, int * pRollerLevel) const
    { return m_pCharacter-> EvalDiceAsClass(dice, baseclassID, pRollerLevel);};
inline double EvalDiceAsClass(DICEPLUS & dice, const SCHOOL_ID& schoolID, int spellLevel, int * pRollerLevel) const
    { return m_pCharacter-> EvalDiceAsClass(dice, schoolID, spellLevel, pRollerLevel);};
inline charStatusType GetStatus() const { return m_pCharacter-> GetStatus(); };
inline void SetEncumbrance(int val) { m_pCharacter -> SetEncumbrance(val); };
inline int  determineEffectiveEncumbrance() { return m_pCharacter -> determineEffectiveEncumbrance(); };
inline BOOL GetAutomatic() const { return m_pCharacter-> GetAutomatic(); };
inline void SetAutomatic(BOOL flag) { m_pCharacter -> SetAutomatic(flag); };
inline BYTE GetMaxMovement() const { return m_pCharacter-> GetMaxMovement(); };
inline double GetNbrHD() const { return m_pCharacter-> GetNbrHD(); };
inline void SetMaxMovement(BYTE val) { m_pCharacter -> SetMaxMovement(val); };
inline int  getCharExpWorth() { return m_pCharacter -> getCharExpWorth(); };
inline int  GetMaxHitPoints() const { return m_pCharacter-> GetMaxHitPoints();};
inline int  GetEffectiveAC(void) const { return m_pCharacter-> GetEffectiveAC();};
inline BOOL IsAlive() { return m_pCharacter -> IsAlive(); };
inline genderType GetGender() const { return m_pCharacter-> GetGender(); };
inline void SetGender(genderType val) { m_pCharacter -> SetGender(val); };
inline void SetGender(const CString& gender) { m_pCharacter -> SetGender(gender); };
inline void InitTargeting(spellTargetingType ttype,
    BOOL canTargetFriend,
    BOOL canTargetEnemy,
    BOOL partyfriend,
    DWORD targs,
    DWORD range,
    int   xSize,
    int   ySize,
    BOOL lingering)
{
    m_pCharacter -> InitTargeting(ttype,
        canTargetFriend,
        canTargetEnemy,
        partyfriend,
        targs,
        range,
        xSize,
        ySize,
        lingering);
};
inline int  GetThiefBackstabDamageMultiplier() const { return m_pCharacter-> GetThiefBackstabDamageMultiplier();};
inline void UpdateSpellForDamage(int DamageTaken) { m_pCharacter -> UpdateSpellForDamage(DamageTaken); };
inline CString  GetUndeadType() const { return m_pCharacter-> GetUndeadType(); };
inline BOOL IsAnimal() const { return m_pCharacter-> IsAnimal();};
inline BOOL IsAlwaysLarge() const { return m_pCharacter-> IsAlwaysLarge();};
inline BOOL HasVorpalImmunity() const { return m_pCharacter-> HasVorpalImmunity();};
inline void ComputeCharacterViewValues(void) { m_pCharacter -> ComputeCharacterViewValues(); };
inline int GetAdjTHAC0(DWORD flags = DEFAULT_SPELL_EFFECT_FLAGS) const { return m_pCharacter-> GetAdjTHAC0(flags);};
inline BOOL GetAdjAllowPlayerControl(DWORD flags = DEFAULT_SPELL_EFFECT_FLAGS) { return m_pCharacter -> GetAdjAllowPlayerControl(flags); };
inline BOOL GetAdjDetectingInvisible(DWORD flags = DEFAULT_SPELL_EFFECT_FLAGS) const { return m_pCharacter-> GetAdjDetectingInvisible(flags);};
enum { MAX_COMBAT_TARGETS = 100 };
int GetUniqueId() { return self; }
void InitFromNPCData(const CHARACTER_ID& characterID, BOOL IsFriendly, const ITEM_LIST & items, const MONEY_SACK & msack);
void GetContext(ActorType * pActor, const BASECLASS_ID& baseclassID) const ;
void GetContext(ActorType * pActor, const SCHOOL_ID& schoolID) const ;
void GetContext(ActorType * pActor, const SPELL_ID& spellID) const ;
void GetContext(ActorType * pActor, const SPELL_DATA * pSpell) const ;
void GetContext(ActorType * pActor) const ; // Unknown class; therefore unknown Level.
BOOL CastSpell(const SPELL_ID& spellID, const SPELL_ID& secondarySpellID);
BOOL CastItemSpell(const SPELL_ID& spellID);
void SpellActivate(const PENDING_SPELL & data);
void InstantSpellActivate(const SPELL_ID& attackSpellID,
                            const SPELL_ID& itemSpellID,
    int target,
        ToHitComputation * pToHitComputation);
BOOL IsSpellPending();
void FaceLocation(int x, int y);
BOOL CheckForGuardingEnemy();
BOOL CheckOpponentFreeAttack(int oldX, int oldY, int newX, int newY);
void FillTargeterList(PATH_DIR dir);
void PlayLaunch() const ;
void PlayCombatDeath() const ;
void PlayCombatTurnUndead() const ;
void RestoreToParty();
BOOL FreeThink(void);
void HandleCombatRoundMsgExpired();
void HandleTimeDelayMsgExpired(int iDeathIndex);
void PostCombatScreenUpdate();
void displayCombatSprite();
void blitDeadSprite();
void blitPetrifiedSprite();
BOOL CanAddTarget(int target);
BOOL C_AddTarget(COMBATANT & dude, int range = 0);
BOOL AddMapTarget(int mapx, int mapy, PATH_DIR dir, int dirX, int dirY);
BOOL AddTargetSelf();
void AutoChooseSpellTargets();
int  GetMaxTargets();
BOOL HaveTarget(int target);
BOOL IsAttackPossible(void);
BOOL DetermineIfBackStab(int wpn, int targ) const ;
void AttackOver();
void StopAttack();
BOOL UseAttackPose();
BOOL NeedMissileAnimation();
void InitMissileAnimation();
BOOL NeedHitAnimation();
void InitHitAnimation();
BOOL NeedSpellCastAnimation();
void InitSpellCastAnimation(int targ);
BOOL NeedSpellInRouteAnimation(int x, int y, BOOL allowSelf);
void InitSpellInRouteAnimation(int x, int y);
void InitSpellInRouteAnimation(int srcx, int srcy, int dstx, int dsty);
BOOL NeedSpellCoverageAnimation();
void InitSpellCoverageAnimation(int x, int y);
BOOL NeedSpellHitAnimation();
void InitSpellHitAnimation(int targ);
BOOL NeedSpellLingerAnimation();
void InitSpellLingerAnimation(/*int mapx, int mapy* /);
void InitSpellLingerAnimation(int targ);
BOOL CanCast();
BOOL CanUse();
BOOL CanTurnUndead();
BOOL CanDelay();
BOOL CanBandage();
CString SpecialActionName();
int SpecialActionIndex();
BOOL CanGuard(GUARDING_CASE guardCase);
void Bandage();
void Quick(BOOL Enable);
void Guard();
void DelayAction();
void TurnUndead();
void StartInitialSpellCasting(const SPELL_ID& spellName, const SPELL_ID& secondarySpellName);
void StartInitialItemSpellCasting(const SPELL_ID& spellID);
void EndInitialSpellCasting();
BOOL IsAttacking() const { return (State() == ICS_Attacking); }
BOOL IsGuarding() const { return (State() == ICS_Guarding); }
BOOL IsCasting();
void StopCasting(BOOL EndTurn, bool canFinishCasting);
SPELL_ID  GetSpellIDBeingCast() const { return m_spellIDBeingCast;};
SPELL_ID  GetSecondarySpellIDBeingCast() const { return m_secondarySpellIDBeingCast;};
SPELL_ID GetEffectiveSpellIDBeingCast() const
    {
        if (m_secondarySpellIDBeingCast.IsValidSpell())
{
    return m_secondarySpellIDBeingCast;
};
return m_spellIDBeingCast;
  };
SPELL_ID  GetItemSpellIDBeingCast() const { return m_itemSpellIDBeingCast;};;
void SetSpellIDBeingCast(const SPELL_ID& spellID, const SPELL_ID& secondarySpellID)
{
    m_spellIDBeingCast = spellID;
    m_secondarySpellIDBeingCast = secondarySpellID;
};
void SetItemSpellIDBeingCast(const SPELL_ID& spellID) { m_itemSpellIDBeingCast = spellID; };
BOOL FetchSpellBeingCast(CHARACTER_SPELL * pCharSp=NULL);
CString RunPSScripts(const CString& scriptName, LPCSTR comment);
void StopMoving() { State(ICS_None); moveX = -1; moveY = -1; }
void moveLeft();
void moveRight();
void moveForward();
void moveBackward();
void moveNW();
void moveNE();
void moveSW();
void moveSE();
BOOL CurrMoveWouldFleeMap();
BOOL TeleportCombatant(int newX, int newY);
BOOL FindPathAwayFrom(int fleeFrom);
int FindPathToMapNorthEdge(void);
int FindPathToMapEastEdge(void);
int FindPathToMapSouthEdge(void);
int FindPathToMapWestEdge(void);
BOOL FindPathToMapEdge();
BOOL FindPathAlongLine(PATH_DIR dir, int dist);
BOOL toggleReadyItem(int item);
BOOL delCharacterItem(int index, int qty);
int   GetTargetKeyDude(DWORD k) const { return (k & 0x0000FFFF); }
int   GetTargetKeyDist(DWORD k) const { return ((k >> 16) & 0x0000FFFF); }
CString FormatSpecAbMsg(DWORD sa_state);
// These ModifyXXX functions dynamically alter character
// values based on spell effects or special abilities.
BOOL ModifyAttackRollDiceForItem
    (const CHARACTER * pTarget,   const ITEM_ID& itemID, const int num, const int sides, int * pBonus, int distance) const ;
BOOL ModifyAttackRollDiceForItemAsTarget
    (const CHARACTER * pAttacker, const ITEM_ID& itemID, const int num, const int sides, int * pBonus) const ;
BOOL ModifyAttackThac0
    (const CHARACTER * pTarget, int * pVal) const ;
BOOL ModifyAttackThac0AsTarget
    (const CHARACTER * pAttacker, int * pVal) const ;
BOOL ModifySaveRoll
    (const CHARACTER * pTarget, int * pRoll) const ;
BOOL ModifySaveRollAsTarget
    (CHARACTER * pAttacker, int * pRoll) const ;

enum SPECIAL_SELF {
    SELF_NewCombatant = -3,
};

};
 */


/*
 * Good Morning,
 * 
 * OK.  Here is what I plan.  This email message
 * will be copied verbatim into the C++ code as
 * comments as a reference.
 * Let me know if it seems wrong.
 *
 * What follows here is a kind of "Pseudo-code"
 * (as if it were being done by hook scripts)
 * and is applied to each combatants; PC, NPC,
 * or monster.  I will attempt to code this
 * algorithm in such a way that hooks could
 * be inserted at any of these points in the
 * hard-coded algorithm.  This may take a couple
 * of days and obviously will require more
 * extensive testing because there are so
 * many possibilities.
 * 
 * $VAR AttacksRemaining;
 * $VAR GuardingAttacksRemaining;
 * $VAR IsGuarding;
 * 
 ** [Guarding-CanGuard]
 * $IF (is monster) $RETURN "N";
 * $IF (rangeWeapon) $RETURN "N";
 * $RETURN "Y";
 * 
 * [Guarding-BeginCombat]
 * GuardingAttacksRemaining = 0;
 * IsGuarding = false;
 * 
 * [Guarding-StartOfRound]
 * AttacksRemaining = <number of attacks allowed>;
 * 
 * [Guarding-Guard]  // combatant enters 'guard' mode
 * GuardingAttacksRemaining = AttacksRemaining
 * IsGuarding = true;
 * 
 * [Guarding-StartOfTurn]  // menu presented for combatant
 * IsGuarding = false;
 * GuardingAttacksRemaining = 0;
 * 
 * [Guarding-CanGuardAttack]  // enemy approaches
 * $IF( !IsGuarding) $RETURN "N";
 * $IF (rangeWeapon) $RETURN "N";
 * $IF(GuardAttacksRemaining <=# 0) $RETURN "N";
 * $IF(AttacksRemaining <=#0) $RETURN "N";
 * $RETURN "Y";
 * 
 * [Guarding-MakeAttack]
 * Decrement GuardAttacksRemaining;
 * $IF(GuardAttacksRemaining <=#0) IsGuarding = false;
 * Decrement AttacksRemaining
 * 
 * [FreeAttack-CanFreeAttack]  // enemy departs
 * $IF(rangeWeapon) $RETURN "N";
 * $RETURN "Y";
 * 
 * [FreeAttack-MakeAttack]
 * Decrement AttacksRemaining;
 * Decrement GuardAttacksRemaining;
 * $IF(GuardAttacksRemaining <=#0) IsGuarding = false;
 * 
 * 
 * [Guarding-MakeAttack]
 * Decrement GuardAttacksRemaining;
 * $IF(GuardAttacksRemaining <=#0) IsGuarding = false;
 * Decrement AttacksRemaining
 * 
 * [CanAttack]
 * $IF (IsGuarding) $RETURN "N";
 * $RETURN "Y";
 * 
 * Now I will attempt to apply this algorithm to your
 * examples.
 * 
 * On 10/17/2011 7:30 PM, Eric Cone wrote:
 * ***> Good afternoon.
 * ***>
 * ***> First things first - terminology.
 * ***>
 * ***> Free attack: an attack that follows all the rules of regular melee
 * ***> physical attacks (with or without weapon weapon, if weapon only range of
 * ***> 1 counts as melee)
 * ***> Guarding attack: a type of free attack that occurs when a combatant
 * ***> moves adjacent to a combatant that is GUARDING. As of this time, only
 * ***> combatants under player control may GUARD. The number of GUARD attacks
 * 
 * Handled by $IF (is monster) in [Guarding-CanGuardAttack]
 * 
 * ***> which may occur between a combatants consecutive turns is equal to it's
 * ***> number of attacks per turn.
 * 
 * Handled by:
 * [Guarding-Guard]
 * [Guarding-StartOfTurn]
 * {Guarding-MakeAttack]
 * 
 * ***>
 * ***> The other kind of free attack, occurs when a combatant moves away from
 * ***> an adjacent square, once per monster moving away.
 * ***>
 * ***> With that in mind, let's use Tom's answers to the questions - he was
 * ***> very thorough, and once the vocabulary is straightened out, I completely
 * ***> agree. It is immediately below-
 * ***>
 * ***> -Eric
 * ***>
 * ***> On Sun, Oct 16, 2011 at 7:40 AM, <Nologgie@aol.com
 * ***> <mailto:Nologgie@aol.com>> wrote:
 * ***>
 * ***>     Good Morning Eric,
 * ***>
 * ***>     Here are the answers I came up with for Paul's questions.
 * ***>
 * ***>     If an enemy is immediately adjacent and moves away then he is
 * ***>     subject to a
 * ***>     free attack.
 * ***>
 * ***>     If an enemy is not immediately adjacent and moves so as to become
 * ***>     immediately adjacent he is subject to a 'guarding' attack, but not a
 * ***>     free attack.
 * ***>
 * ***>     The Exact Rules:
 * ***>
 * ***>     Free Attacks
 * ***>
 * ***>     1. The 'free attack' is actually comprised of the attacker's entire
 * ***>     'attack
 * ***>     routine' for a combat round. This is normally 1 or 2 attacks for
 * ***>     characters. For 'monsters', it may be 8 or more.
 * ***>
 * ***>     2. Free attacks will always occur if the target is valid
 * ***>     (IsValidTarget !=
 * ***>     "N") and the attacker is able to execute a melee attack.
 * ***>     (IsCombatReady !=
 * ***>     "N", and a missile weapon is not readied.)
 * 
 * Handled by [FreeAttack-CanFreeAttack]
 * 
 * 
 * ***>
 * ***>     3. If a free attack occurs before the attacker's normal action for the
 * ***>     round, any attacks executed are deducted from the attacks available
 * ***>     for that
 * ***>     round. If the attacks are depleted it constitutes the combatant's
 * ***>     action for
 * ***>     the round, and the combatant gets no 'turn'.
 * 
 * Handled by [FreeAttack-MakeFreeAttack]
 * You did not specify this so I made a guess
 * that a free attack should also reduce the
 * number of guard attacks remaining.
 * 
 * ***>
 * ***>     4. Free attacks are allowed against fleeing enemies regardless of
 * ***>     whether
 * ***>     the attacker has any 'normal' attacks remaining, so in that sense
 * ***>     they are
 * ***>     unlimited.
 * ***>
 * 
 * Handled by [FreeAttack-CanFreeAttack]
 * 
 * 
 * ***>     Guarding Attacks
 * ***>
 * ***>     Combatants who do not have missile weapons readied may select
 * ***>     'Guard' as a
 * ***>     combat action. If a non-adjacent enemy moves adjacent to a guarding
 * 
 * Handled by [Guarding-CanGuard]
 * 
 * ***>     combatant, the guarding combatant will execute its attack routine.
 * ***>     Any attacks made
 * ***>     will be deducted from those available to the attacker in the combat
 * ***>     round
 * ***>     when guard was set. If the attacks are depleted, guarding status is
 * ***>     removed.
 * 
 * Handled by:
 * [MakeAttack]
 * [FreeAttack-MakeFreeAttack]
 * [Guarding-MakeAttack]
 * 
 * ***>
 * ***>     Example:
 * 
 * [StartOfCombat]
 * GuardAttacksRemaining=0;
 * 
 * 
 * ***>     A combatant selects Guard in round three. If an enemy moves adjacent
 * ***>     prior
 * [Guarding-StartOfRound] Round 3
 * AttacksRemaining = 3; // for example
 * [Guarding-Guard] round 3
 * GuardAttacksRemaining = AttacksRemaining = 3;  //for example
 * [Guarding-GuardAttack] round 3
 * Decrement GuardAttacksRemaining (now = 2)
 * ***>     to the guarding combatant's turn in round four, the guarding
 * ***>     combatant will
 * 
 * [GuardIng-StartOfRound] Round 4
 * AttacksRemaining = 3;
 * 
 * ***>     execute its attack routine, and the attacks will be counted against the
 * ***>     attacks available in round three (when Guard was set). The
 * ***>     combatant's round
 * ***>     four turn remains available.
 * 
 * [Guarding-GuardAttack]
 * Decrement AttacksAvailable (now = 3)
 * Decrement GuardAttacksRemaining (now = 1)
 * 
 * The rest of your explanation assumed that
 * 'free attacks' are completely separate from
 * 'guard attacks' whereas my questions assumed
 * they were two different aspects of the same
 * thing.  So the answers did not apply to the
 * intent of my questions.
 * 
 * 
 * PAul
 */


/*  Email added 20120627
*****************************************************************************************
*****************************************************************************************
*****************************************************************************************
*****************************************************************************************
  
The Exact Rules:

Free Attacks

1. The 'free attack' is actually comprised of the attacker's entire 'attack
routine' for a combat round. This is normally 1 or 2 attacks for
characters. For 'monsters', it may be 8 or more.

2. Free attacks will always occur if the target is valid (IsValidTarget !=
"N") and the attacker is able to execute a melee attack. (IsCombatReady !=
"N", and a missile weapon is not readied.)

3. If a free attack occurs before the attacker's normal action for the
round, any attacks executed are deducted from the attacks available for that
round. If the attacks are depleted it constitutes the combatant's action for
the round, and the combatant gets no 'turn'.

4. Free attacks are allowed against fleeing enemies regardless of whether
the attacker has any 'normal' attacks remaining, so in that sense they are
unlimited.

-----

**Who can execute a free attack?
Any combat-ready combatant without a readied missile weapon.

**When can he execute a free attack?
When an adjacent enemy who is a valid target moves away.

**Against whom can he execute a free attack?
Any adjacent enemy who is a valid target and moves away.

**How often can he execute a free attack?
Once each time any adjacent enemy who is a valid target moves away.

**How many free attacks?
A combatant uses all of his available attacks, until either the adjacent enemy is no longer adjacent, the adjacent enemy is dead, or the number of available attacks reaches zero.

**Is there more than one kind of free attack?
No. It only applies to physical melee attacks as described.

**Do the same rules apply to monsters?
**How are they different?
**Do we need a hook to allow more complicated logic.
The same rules apply to monsters.

*************************************************************

Guarding Attacks

Combatants who do not have missile weapons readied may select 'Guard' as a
combat action. If a non-adjacent enemy moves adjacent to a guarding
combatant, the guarding combatant will execute its attack routine. Any attacks made
will be deducted from those available to the attacker in the combat round
when guard was set. If the attacks are depleted, guarding status is removed.
*Note: Fleeing combatants may not guard, this applies to all - PC, NPC and monster; friendly and enemy.

Example:
A combatant selects Guard in round three. If an enemy moves adjacent prior
to the guarding combatant's turn in round four, the guarding combatant will
execute its attack routine, and the attacks will be counted against the
attacks available in round three (when Guard was set). The combatant's round
four turn remains available.

-----

**Who can execture a guarding attack?
Any combatant who matches the "Guarding Attack" criteria above.

**When can he execute a guarding attack?
When a non-adjacent enemy combatant moves adjacent.

**How often can he execute a guarding attack?
Each time a non-adjacent enemy combatant moves to become adjacent, and the combatant has more than zero available guarding attacks.

**How many guarding attacks?
A combatant uses all of his available attacks, until either the adjacent enemy is no longer adjacent, the adjacent enemy is dead, or the number of available attacks reaches zero.

**Is there more than one kind of guarding attack?
No. It only applies to physical melee attacks as described.

**Do the same rules apply to monsters?
**How are they different?
**Do we need a hook to allow more complicated logic.
Yes, monsters follow the same rules.

************************************************************************

$VAR AttacksRemaining;
$VAR GuardingAttacksRemaining;
$VAR IsGuarding;

[Guarding-CanGuard]
$IF (is monster) $RETURN "N";
$IF (rangeWeapon) $RETURN "N";
$RETURN "Y";

[Guarding-BeginCombat]
GuardingAttacksRemaining = 0;
IsGuarding = false;

[Guarding-StartOfRound]
AttacksRemaining = <number of attacks allowed>;

[Guarding-Guard]  // combatant enters 'guard' mode
GuardingAttacksRemaining = AttacksRemaining
IsGuarding = true;

[Guarding-StartOfTurn]  // menu presented for combatant
IsGuarding = false;
GuardingAttacksRemaining = 0;

[Guarding-CanGuardAttack]  // enemy approaches
$IF( !IsGuarding) $RETURN "N";
$IF (rangeWeapon) $RETURN "N";
$IF(GuardAttacksRemaining <=# 0) $RETURN "N";
$IF(AttacksRemaining <=#0) $RETURN "N";
$RETURN "Y";

[Guarding-MakeAttack]
Decrement GuardAttacksRemaining;
$IF(GuardAttacksRemaining <=#0) IsGuarding = false;
Decrement AttacksRemaining

[FreeAttack-CanFreeAttack]  // enemy departs
$IF(rangeWeapon) $RETURN "N";
$RETURN "Y";

[FreeAttack-MakeFreeAttack]
Decrement AttacksRemaining;
Decrement GuardAttacksRemaining;
$IF(GuardAttacksRemaining <=#0) IsGuarding = false;


[MakeAttack]
Decrement GuardAttacksRemaining;
$IF(GuardAttacksRemaining <=#0) IsGuarding = false;
Decrement AttacksRemaining

[CanAttack]
$IF (IsGuarding) $RETURN "N";
$RETURN "Y";

******

*/


COMBATANT.prototype.FreeAttackDistance = function (i, j, k, l, m, n)
{
    return 1;
}


//*****************************************************************************
//    NAME: COMBATANT::CheckOpponentFreeAttack
//
// PURPOSE: 
//
//*****************************************************************************
COMBATANT.prototype.CheckOpponentFreeAttack = function(oldX, oldY, newX, newY) {
    // See the email in the comments immediately above this function

    // More email adde 20120627
    // check clockwise around current location
    // looking for enemy that
    // can make an attack.
    var found = false;
    var maxDude = -1;
    var dude = 0;

    var wasAdjacent = []; 
    var willBeAdjacent = [];
    var tempCOMBATANT;
    var qcomb = QueuedCombatantData;
    var dx = 0, dy = 0;
    for (var idx = 0; idx < Globals.MAX_COMBATANTS; idx++) { wasAdjacent[idx] = 0; } // PORT NOTE:  Was memset(wasAdjacent, 0, MAX_COMBATANTS);
    for (var idx = 0; idx < Globals.MAX_COMBATANTS; idx++) { willBeAdjacent[idx] = 0; } // PORT NOTE:  Was memset(willBeAdjacent, 0, MAX_COMBATANTS);


    for (dx = -1; dx <= this.width; dx++) {
        for (dy = -1; dy <= this.height; dy++) {
            if (Drawtile.coordsOnMap(newX + dx, newY + dy, 1, 1)) {
                dude = Drawtile.getCombatantInCell(newX + dx, newY + dy, 1, 1, this.self);
                if (dude != NO_DUDE) {
                    if (combatData.getCombatantPtr(dude).charOnCombatMap(false, false)) {
                        if (dude > maxDude) maxDude = dude;
                        willBeAdjacent[dude] = 1;  // opponent will be adjacent
                    };
                };
            };
        };
    };
    for (dx = -1; dx <= this.width; dx++) {
        for (dy = -1; dy <= this.height; dy++) {
            if (Drawtile.coordsOnMap(oldX + dx, oldY + dy, 1, 1)) {
                dude = Drawtile.getCombatantInCell(oldX + dx, oldY + dy, 1, 1, this.self);
                if (dude != NO_DUDE) {
                    if (combatData.getCombatantPtr(dude).charOnCombatMap(false, false)) {
                        if (dude > maxDude) maxDude = dude;
                        wasAdjacent[dude] = 1;  // opponent was adjacent
                    };
                };
            };
        };
    };



    qcomb = Globals.GetQueuedCombatants();

    // Perform Guard Attacks first.  They will get
    // pushed onto QComb and then the Free Attacks will
    // get pushed on top of them/
    // In that way, the Free Attacks will be performed first.
    for (dude = 0; dude <= maxDude; dude++) {
        if (willBeAdjacent[dude] && !wasAdjacent[dude]) {
/*#ifdef TraceFreeAttacks       // PORT NOTE: This seemed to be off
            {
                COMBATANT * pOtherCombatant;
                CString direction;
                direction = "Approaches";
                pOtherCombatant = GetCombatantPtr(dude);
                WriteDebugString("TFA - %s %s %s\n", GetName(), direction, pOtherCombatant -> GetName());
            };
#endif*/
            tempCOMBATANT = Globals.GetCombatantPtr(dude);              // PORT NOTE: yes this is different from getCombatantPtr with a lower case g
            Globals.ASSERT(tempCOMBATANT != null, "tempCOMBATANT != null");
            if (tempCOMBATANT != null) {
                if (tempCOMBATANT.m_ICS == individualCombatantState.ICS_Casting) {
                    continue;
                };
                if (tempCOMBATANT.GetIsFriendly() != this.GetIsFriendly()) {
                    if (!(combatData.IsValidTarget(tempCOMBATANT, this, null).answer)) {   // PORT NOTE:  the last parameter here can be affected in this method, but is not if null is passed in
//#ifdef TraceFreeAttacks       // PORT NOTE: This seemed to be off
//                        WriteDebugString("'IsValidTarget' script says that this is not a valid target\n");
//#endif
                        continue;
                    };
                    var hookParameters = new HOOK_PARAMETERS();
                    var scriptContext = new SCRIPT_CONTEXT();
                    var result = "";
                    hookParameters[5] = "" + parseInt(tempCOMBATANT.AttacksRemaining());
                    hookParameters[6] = "" + tempCOMBATANT.IsPartyMember() ? "Y" : "N";
                    hookParameters[7] = "" + tempCOMBATANT.OnAuto(false) ? "Y" : "N";
                    scriptContext.SetAttackerContext(tempCOMBATANT);
                    scriptContext.SetTargetContextCombatant(this);

                    {
                        var performGuardAttack = false;
                        performGuardAttack = false;
                        if (tempCOMBATANT.canAttack(this.self,
                            newX, newY,
                            tempCOMBATANT.GetNbrAttacks(),
                            this.FreeAttackDistance,
                            false)) {
/*#ifdef TraceFreeAttacks
                            WriteDebugString("TFA - Call script 'Guarding-CanGuardAttack(%s,%s,%s)'\n",
                                hookParameters[5],
                                hookParameters[6],
                                hookParameters[7]);
#endif*/
                            result = tempCOMBATANT.RunCombatantScripts(
                                SPECAB.GUARDING_CAN_GUARD_ATTACK,
                                SPECAB.ScriptCallback_RunAllScripts,
                                null,
                                "Check opponent free attack");
//#ifdef TraceFreeAttacks
//                            WriteDebugString("TFA - script 'Guarding-CanGuardAttack' returned \"%s\"\n", result);
//#endif
                            scriptContext.Clear();
                            if (!UAFUtil.IsEmpty(result)) {
                                if (result[0] == 'Y') {
                                    performGuardAttack = true;
                                };
                            };

                        };
                        if (performGuardAttack) {
//#ifdef TraceFreeAttacks
//                            WriteDebugString("TFA - queueing %s to make guard attack\n", GetCombatantPtr(dude) -> GetName());
//#endif
                            // Restore my original position until after the opponent has made
                            // his free attack.
                            // First, check that we are still at the top of the queue.  There may
                            // have been other Free Attackers.
                            if (qcomb.Top() == this.self)  // There may be attackers befor this one.
                            // So we only do this once.
                            {
                                qcomb.SetXY(newX, newY);
                                // remove dude from new location
                                Drawtile.placeCombatant(this.x, this.y, NO_DUDE, this.width, this.height);
                                this.x = oldX;
                                this.y = oldY;
                                Drawtile.placeCombatant(this.x, this.y, this.self, this.width, this.height); // added 20160927 PRS
                            };
                            // queue up the attackers
                            qcomb.Push(dude, false, 0, 1);
                            // give self as target to each attacker
                            tempCOMBATANT.turnIsDone = false;
                            tempCOMBATANT.RemoveAllTargets();
                            tempCOMBATANT.AddTarget(this.self, true);
                            // set each attacker in attack mode (if possible)
                            found = true;
/*#ifdef TraceFreeAttacks
                        }
                        else {
                            WriteDebugString("TFA - No Guard Attack is possible\n");
#endif*/
                        };
                    };
/*#ifdef TraceFreeAttacks
                }
                else {
                    WriteDebugString("TFA - But they are friends\n");
#endif*/
                };
            };
        };
    }
    for (dude = 0; dude <= maxDude; dude++) {
        if (wasAdjacent[dude] && !willBeAdjacent[dude]) {
/*#ifdef TraceFreeAttacks
            {
                COMBATANT * pOtherCombatant;
                CString direction;
                direction = "Retreats From";
                pOtherCombatant = GetCombatantPtr(dude);
                WriteDebugString("TFA - %s(%d) %s %s(%d)\n", GetName(), self, direction, pOtherCombatant -> GetName(), dude);
            };
#endif*/
            tempCOMBATANT = Globals.GetCombatantPtr(dude);
            Globals.ASSERT(tempCOMBATANT != null, "tempCOMBATANT != null");
            if (tempCOMBATANT != null) {
                if (tempCOMBATANT.m_ICS == individualCombatantState.ICS_Casting) {
                    continue;
                };
                if (tempCOMBATANT.GetIsFriendly() != this.GetIsFriendly()) {
                    if (!(combatData.IsValidTarget(tempCOMBATANT, this, null).answer)) {
//#ifdef TraceFreeAttacks
//                        WriteDebugString("'IsValidTarget' script says that this is not a valid target\n");
//#endif
                        continue;
                    };
                    var hookParameters = new HOOK_PARAMETERS();
                    var scriptContext = new SCRIPT_CONTEXT();
                    var result = "";
                    hookParameters[5] = parseInt(tempCOMBATANT.AttacksRemaining());
                    hookParameters[6] = tempCOMBATANT.IsPartyMember() ? "Y" : "N";
                    hookParameters[7] = tempCOMBATANT.OnAuto(false) ? "Y" : "N";
                    hookParameters[8] = parseInt(tempCOMBATANT.GetNbrAttacks());
                    scriptContext.SetAttackerContext(tempCOMBATANT);
                    scriptContext.SetTargetContextCombatant(this);

                    {
                        var freeAttackCount = 0;
                        freeAttackCount = 0;
                        if (tempCOMBATANT.canAttack(this.self,
                            oldX, oldY,
                            tempCOMBATANT.m_pCharacter.GetNbrAttacks(),
                            this.FreeAttackDistance,
                            false)) {
/*#ifdef TraceFreeAttacks
                            WriteDebugString("TFA - Call script 'FreeAttack-CanFreeAttack(%s,%s,%s,%s)\n",
                                hookParameters[5],
                                hookParameters[6],
                                hookParameters[7],
                                hookParameters[8]);
#endif*/
                            result = tempCOMBATANT.RunCombatantScripts(
                                SPECAB.FREEATTACK_CAN_FREE_ATTACK,
                                SPECAB.ScriptCallback_RunAllScripts,
                                null,
                                "Can opponent free attack");
//#ifdef TraceFreeAttacks
//                            WriteDebugString("TFA - Script 'FreeAttack-CanFreeAttack' returned \"%s\"\n",
//                                result);
//#endif
                            scriptContext.Clear();
                            if (!UAFUtil.IsEmpty(result)) {
                                if (result[0] == 'Y') {
                                    freeAttackCount = 1 + tempCOMBATANT.AttacksRemaining();
                                }
                                else {
                                    var n = 0;
                                    n = parseInt(result);
                                    if (n > 0) {
                                        freeAttackCount = n;
                                    };
                                };
                            };
                        };
                        if (freeAttackCount) {               
//#ifdef TraceFreeAttacks
//                            WriteDebugString("TFA - queueing %s(%d) to make free attack\n", GetCombatantPtr(dude) -> GetName(), dude);
//#endif
                            // queue up the attackers
                            if (qcomb.Top() == this.self) // There may be several Free Attackers before this one!
                            // So we only do this once.
                            {
                                qcomb.SetXY(newX, newY);
                                // remove dude from new location
                                Drawtile.placeCombatant(this.x, this.y, NO_DUDE, this.width, this.height);
                                this.x = oldX;
                                this.y = oldY;
                                // put dude into original location
                                Drawtile.placeCombatant(this.x, this.y, this.self, this.width, this.height); // added 20160927 PRS
                            };
                            qcomb.Push(dude, false, freeAttackCount, 0);
                            // give self as target to each attacker
                            tempCOMBATANT.turnIsDone = false;
                            tempCOMBATANT.RemoveAllTargets();
                            tempCOMBATANT.AddTarget(this.self, true);
                            // set each attacker in attack mode (if possible)
                            //tempCOMBATANT->StartAttack(self, qcomb->NumFreeAttacks());
                            found = true;
/*#ifdef TraceFreeAttacks
                        }
                        else {
                            WriteDebugString("TFA - No Free Attack is possible\n");
#endif*/
                        };
                    };
                };
            };
        };
    }
    return found;
}



//*****************************************************************************
// NAME: canAttack
//
// PURPOSE:  
// check non-magical attack capabilities
//*****************************************************************************
COMBATANT.prototype.canAttack = function(targ, targetX, targetY, additionalAttacks, DistanceFunction, canAttackSelf) {
    if (this.availAttacks + additionalAttacks <= 0)
        return false;

    if (targ == NO_DUDE)
        return false;

    if ((this.availAttacks + additionalAttacks < 1.0)
        && (Globals.GetCurrentRound() - this.lastAttackRound <= 1))
        return false;

    // cannot attack yourself
    if ((targ == this.self) && !canAttackSelf)
        return false;

    var targCOMBATANT;
    targCOMBATANT = Globals.GetCombatantPtr(targ);
    Globals.ASSERT(targCOMBATANT != null, "tempCOMBATANT != null");
    if (targCOMBATANT == null) return false;
    if (targetX < 0) targetX = targCOMBATANT.x;
    if (targetY < 0) targetY = targCOMBATANT.y;

    // if attacking dude on same side of battle
    if (targCOMBATANT.GetIsFriendly() == this.GetIsFriendly()) {
        // AI will never attack dudes on same side
        if (this.OnAuto(false) && !canAttackSelf) // includes all monsters (always auto), and auto dudes.
        {
            return false;
        }
        else if ((targCOMBATANT.GetType() == CHAR_TYPE) && !canAttackSelf) {
            // cannot attack pc party members with weapon
            return false;
        }
        else if ((targCOMBATANT.GetType() == NPC_TYPE) && (!targCOMBATANT.m_pCharacter.IsPreGen)) {
            // if player chooses to attack friendly npc, the npc changes sides,
            // even if unable to perform attack due to following checks.
            //
            // This does not belong here.  We are only attempting to determine
            // if we CAN attack targCOMBATANT.  We have not actually performed
            // any attack yet.  Perhaps this line of code belongs elsewhere.
            // PRS 20140916
            //targCOMBATANT->friendly = !targCOMBATANT->friendly;
            //
            //
            //
            // npc will leave the battle (and the party after combat)?
            //targCOMBATANT.SetMorale(0);
        }
    }
    var dis = DistanceFunction(this.self, this.x, this.y, targ, targetX, targetY);
    var mywpnitemidx = this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0);
    if (mywpnitemidx != NO_READY_ITEM) {
        // using a weapon rather than natural attack types (ie claws/jaws/fists)
        var wpn_ID;
        wpn_ID = this.m_pCharacter.myItems.GetItem(mywpnitemidx);

        if (this.m_pCharacter.myItems.GetQty(mywpnitemidx) <= 0)
            return false;

        if (!Items.WpnCanAttackAtRange(wpn_ID, dis))
            return false;

        switch (itemData.GetWpnType(wpn_ID)) {
            case weaponClassType.NotWeapon: // not weapon, must be used, invokes special abilities
                //if (isMagical(wpn_giID))
                if (Items.isMagical(wpn_ID)) {
                    if (this.m_pCharacter.myItems.GetCharges(mywpnitemidx) <= 0)
                        return false;
                }
                else
                    return false;
                break;

            case weaponClassType.HandBlunt: // hand, no throw, blunt
            case weaponClassType.HandCutting: // hand, no throw, cutting
            case weaponClassType.HandThrow: // hand or throw
            case weaponClassType.SlingNoAmmo: // sling
            case weaponClassType.SpellCaster:
            case weaponClassType.SpellLikeAbility:
                //
                // handled by WpnCanAttackAtRange()
                //
                break;

            case weaponClassType.Bow: // bow
            case weaponClassType.Crossbow: // crossbow
                {
                    var myammoitemidx = this.m_pCharacter.myItems.GetReadiedItem(Items.AmmoQuiver, 0);

                    // arrows or bolts must be readied in AmmoQuiver
                    if (myammoitemidx == NO_READY_ITEM)
                        return false;

                    var ammo_ID = this.m_pCharacter.myItems.GetItem(myammoitemidx);

                    if (itemData.GetWpnType(ammo_ID) != weaponClassType.Ammo)
                        return false;

                    // ammo class must match between weapon and ammo
                    var myammoclass = this.m_pCharacter.myItems.GetAmmoClass(myammoitemidx);
                    if (UAFUtil.IsEmpty(myammoclass)) return false; // might be wand,potion,amulet,etc

                    if (myammoclass != this.m_pCharacter.myItems.GetAmmoClass(mywpnitemidx))
                        return false;

                    // must have non-zero qty of ammo
                    if (this.m_pCharacter.myItems.GetQty(myammoitemidx) <= 0)
                        return false;
                }
                break;

            case Throw:
                //
                // handled by WpnCanAttackAtRange()
                //
                break;

            case weaponClassType.Ammo: // ammo - arrows or bolts
                return false;

            default:
                Globals.WriteDebugString("Unhandled item Wpn_Type in canAttack()\n");
                return false;
        }
    }
    else {
        // use natural attack weapons (ie claws, jaws, paws, fists)
        if (dis > 1)                // PORT NOTE:  - I think this may be a bug.  Should be able to move into a diagonal attack - which would make the distance 2?
            return false;
    }

    // passed all tests so far, now check for line of sight
    if (!Drawtile.HaveLineOfSight(this.GetCenterX(), this.GetCenterY(), targetX, targetY, null))
        return false;

    if (!(combatData.IsValidTarget(this, targCOMBATANT, null).answer)) return false;
    
    if (dis > 1) {
        if (!this.GetAdjDetectingInvisible()) {
            // cannot attack invisible targets with ranged weapons
            if (targCOMBATANT.GetAdjSpecAb(SPECAB.SA_Invisible))
                return false;

            if (!UAFUtil.IsEmpty(this.GetUndeadType())) {
                if (targCOMBATANT.GetAdjSpecAb(SPECAB.SA_InvisibleToUndead))
                    return false;
            }

            if (this.IsAnimal()) {
                if (targCOMBATANT.GetAdjSpecAb(SPECAB.SA_InvisibleToAnimals))
                    return false;
            }
        }
    }

    return true;
}


COMBATANT.prototype.AddTarget = function (newTarget, freeAttack) {

    if (newTarget == NO_DUDE)
        return;

    this.RemoveTarget(newTarget);

    if (this.CanTarget(freeAttack)) {
        // if using weapon, change to new target (only one allowed)

        var targCOMBATANT;
        targCOMBATANT = Globals.GetCombatantPtr(newTarget);
        Globals.ASSERT(targCOMBATANT != null, "tempCOMBATANT != null");
        if (targCOMBATANT == null) return;

        var dist = Drawtile.Distance6(this.self, this.x, this.y,
            targCOMBATANT.self, targCOMBATANT.x, targCOMBATANT.y);

        this.combattargets.Insert(newTarget,
            this.MakeTargetKey(newTarget, dist));
    }

    this.SetCurrTarget();
}


COMBATANT.prototype.RemoveTarget = function (target) {
    if (this.combattargets.GetCount() == 0)
        return;

    var pos = combattargets.GetHeadPosition();
    while (pos != null) {
        if (combattargets.PeekAtPos(pos) == targ) {
            combattargets.RemoveAt(pos);
            return;
        }
        else
            combattargets.GetNext(pos);
    }
}

COMBATANT.prototype.CanTarget = function(freeAttack) {
    if (!freeAttack && this.IsDone(freeAttack, "Can combatant choose target")) return false;

    if ((this.State() == individualCombatantState.ICS_Casting) || (this.State() == individualCombatantState.ICS_Using)) {
        Globals.die(0xab4c9); // spell targeting uses different data structures
        return false;
    }
    else
        return true;
}

COMBATANT.prototype.IsDone = function(freeAttack, comment) {
    switch (this.GetStatus()) {
        case individualCombatantState.Petrified:
            return true;
        default:
            break;
    };

    if (this.m_isCombatReady < 0) {
        var actor;
        var hookParameters = new HOOK_PARAMETERS();
        var scriptContext = new SCRIPT_CONTEXT();
        if (this.m_isCombatReady == -1) hookParameters[5] = "Round";
        if (this.m_isCombatReady == -2) hookParameters[5] = "Action";
        this.m_isCombatReady = 1;
        actor = this.GetContextActor();
        RunTimeIF.SetCharContext(actor);
        scriptContext.SetCharacterContext(this.m_pCharacter);
        scriptContext.SetCombatantContext(this);
        var result = this.m_pCharacter.RunCharacterScripts(
            SPECAB.IS_COMBAT_READY,
            SPECAB.ScriptCallback_LookForChar,
            "N",
            comment);

        if (!UAFUtil.IsEmpty(result)) {
            this.m_isCombatReady = 0;
        }
        else {
            result = this.RunCombatantScripts(
                SPECAB.IS_COMBAT_READY,
                SPECAB.ScriptCallback_LookForChar,
                "N",
                comment);
            if (!UAFUtil.IsEmpty(result)) {
                this.m_isCombatReady = 0;
            }
        };
        RunTimeIF.ClearCharContext();
    };

    if (this.m_isCombatReady == 0) return true;

    if (!this.charOnCombatMap(false, false))
        this.turnIsDone = true;
    if (freeAttack) {
        if (this.m_target == NO_DUDE) {
            this.turnIsDone = true;
        };
    };

    return this.turnIsDone;
}

COMBATANT.prototype.StopCasting = function(EndYourTurn, canFinishCasting) {
    if (canFinishCasting) return;
    //WriteDebugString("StopCasting() for %i, EndYourTurn %i\n", self,EndYourTurn);
    this.m_pCharacter.targets.Clear();
    this.m_spellIDBeingCast = "";
    this.m_itemSpellIDBeingCast = "";
    this.Wpn_Type = weaponClassType.NotWeapon;

    if (this.State() == individualCombatantState.ICS_Casting)
        this.State(individualCombatantState.ICS_None);

    if (this.combatant_pendingSpellKey >= 0) {
        this.pendingSpellList.Remove(combatant_pendingSpellKey);
        this.combatant_pendingSpellKey = -1;
    }
    this.combatant_activeSpellKey = -1;
    this.forceAttackPose = false;
    if (EndYourTurn)
        this.EndTurn(this.State());
}


COMBATANT.prototype.makeAttack = function(targ, extraAttacksAvailable, pDeathIndex)
{
    var wpnConsumesSelfAsAmmo = false; // Assign value to make compiler happy!
    if (targ == 0) {
        Globals.ASSERT(true, "targ == 0");
    };
    var toHitComputation = new ToHitComputation();
    Globals.ASSERT(this.self != NO_DUDE, "this.self != NO_DUDE");
    if (this.IsDone(false, "Can combatant make attack")) return 1;
    toHitComputation.BeginSpellScriptFailure(0);
    DispText.CombatMsg = "";
    FormattedText.ClearFormattedText(FormattedText.combatTextData);
    if (targ == NO_DUDE) return 1;
    if (this.availAttacks + extraAttacksAvailable <= 0) return 1;

    {
        var msg = "";
        var nbrattacks = this.GetNbrAttacks();
        var availattacks = this.availAttacks;
        var currAttack = nbrattacks - availattacks;

        if ((currAttack < 0) || (currAttack >= nbrattacks)) currAttack = 0;
        monsterData.GetMonsterAttackMsg(this.m_pCharacter.monsterID, currAttack, msg);
        if (msg == "*NoAttack*") return 1;
    };

    Drawtile.EnsureVisibleTargetTargetForceCenter(targ, false);

    this.lastAttackRound = Globals.GetCurrentRound();
    this.State(individualCombatantState.ICS_Attacking);
    this.StopCasting(false, false);

    var targCOMBATANT;
    targCOMBATANT = Globals.GetCombatantPtr(targ);
    Globals.ASSERT(targCOMBATANT != null, "targCOMBATANT != null");
    if (targCOMBATANT == null) return 1;
    if (targCOMBATANT.GetStatus() == individualCombatantState.Dead) return 1; // not on the map anymore

    var decQty = false;
    var wpn = 0;
    wpn = this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0);
    var itemID = "";
    itemID = "";

    if (wpn != NO_READY_ITEM) {
        itemID = this.m_pCharacter.myItems.GetItem(wpn);
        var dist = Drawtile.Distance6(this.self, this.x, this.y,
            targCOMBATANT.self, targCOMBATANT.x, targCOMBATANT.y);
        decQty = itemData.WpnConsumesAmmoAtRange(itemID, dist);

        // do we decrement weapon qty or ammo qty?
        wpnConsumesSelfAsAmmo = itemData.WpnConsumesSelfAsAmmo(itemID);
        if (decQty && !wpnConsumesSelfAsAmmo) {
            // ammo is readied and must be decremented
            wpn = this.m_pCharacter.myItems.GetReadiedItem(Items.AmmoQuiver, 0);
            itemID = this.m_pCharacter.myItems.GetItem(wpn);
        }
    }

    {
        var actor;
        this.GetContextActor();
        RunTimeIF.SetCharContext();
        actor = targCOMBATANT.GetContextActor();
        RunTimeIF.SetTargetContext(actor);
    };
    var pWeapon = null;
    if (!(itemData.IsNoItem(itemID))) {
        pWeapon = itemData.GetItemFromID(itemID);
    };

    toHitComputation.Compute4(this, targ, targCOMBATANT, wpn);

    if (toHitComputation.DidHit())
    {
        toHitComputation.SetSuccessful(1);
/*#ifdef TraceFreeAttacks      //PORT NOTE: This was off
        {
            WriteDebugString("TFA - %s succeeds in hitting %s; numberAttacks=%d; availAttacks=%d\n",
                GetName(), targCOMBATANT -> GetName(), int(GetNbrAttacks()), int(availAttacks));
        };
#endif */

        var damageComputation = new DamageComputation();

        var attackSpellID = "", itemSpellID = "";    //SPELL_ID 
        if (wpn != NO_READY_ITEM) {
            var pSpell;
            itemSpellID = pWeapon.SpellID();
            if (!UAFUtil.IsEmpty(itemSpellID)) {
                pSpell = spellData.PeekSpell(itemSpellID);
                if (itemSpellID.IsValidSpell()) {
                    //Not Implemented(0x551c, false);
                }
                else {
                    var msg = "";
                    if (!debugStrings.AlreadyNoted("WNHUSN")) {
                        msg = "A Weapon named:\n" + pWeapon.UniqueName() + "\nhas an undefined spell named\n" + pWeapon.SpellID();
                        Globals.MsgBoxInfo(msg, "Warning");
                    };
                };
            };
        }
        else {
            if (this.GetType() == MONSTER_TYPE) {
                var nbrAttacks = this.GetNbrAttacks();
                var currAttack = nbrAttacks - this.availAttacks;
                //20130829 PRS  ASSERT( (currAttack>=0) && (currAttack<nbrAttacks) );
                if ((currAttack < 0) || (currAttack >= nbrAttacks)) currAttack = 0;

                var pMonster = monsterData.PeekMonster(this.m_pCharacter.monsterID);
                Globals.ASSERT(pMonster != null, "pMonster != null");

                attackSpellID = pMonster.attackData.PeekMonsterAttackDetails(currAttack).spellID;
            };
        };




        this.InstantSpellActivate(attackSpellID, itemSpellID, toHitComputation);
        if ((UAFUtil.IsEmpty(attackSpellID) && UAFUtil.IsEmpty(itemSpellID))
            || (toHitComputation.BeginSpellScriptFailure() == 0)) {
            damageComputation.Compute(this,
                targCOMBATANT,
                wpn,
                toHitComputation.Rolled(),
                toHitComputation.IsBackStab(),
                toHitComputation.BackstabMultiplier());
            {
                if (!UAFUtil.IsEmpty(itemID)) {                   // PORT NOTE:   Was if (!itemID.IsNoItem()), but this just checked to see if it was empty
                    var noSpell = "";
                    if (pWeapon.IsUsable() && (pWeapon.Wpn_Type == weaponClassType.SpellCaster)) {
                        this.InstantSpellActivate(pWeapon.spellID, noSpell, targ, toHitComputation);
                    };
                    if (pWeapon.IsUsable() && (pWeapon.Wpn_Type == weaponClassType.SpellLikeAbility)) {
                        this.InstantSpellActivate(pWeapon.spellID, noSpell, targ, toHitComputation);
                    };
                };
            };

            targCOMBATANT.UpdateSpellForAttacks(1);

            this.PlayHit();

            {
                pDeathIndex = targCOMBATANT.TakeDamage(damageComputation.Damage(),
                    damageComputation.IsNonLethal(),
                    null,
                    targCOMBATANT == this,
                    pDeathIndex);

                if (targCOMBATANT.GetStatus() == charStatusType.Dead) {
                    // no longer a valid target
                    this.RemoveCurrTarget();
                }
            };
            {
                if (spellData.IsValidSpell(damageComputation.SpellID())) {
                    var samsg = "";
                    var pSpell = spellData.GetSpell(damageComputation.SpellID());
                    Globals.ASSERT(pSpell != null, "pSpell != null");
                    if (pSpell != null) {
                        samsg = pSpell.CastMsg;
                        samsg.ReplaceAll("/s", pSpell.Name);
                        samsg.ReplaceAll("/c", this.GetName());
                        if (targCOMBATANT != null)
                            samsg.ReplaceAll("/t", targCOMBATANT.GetName());
                        else
                            samsg.ReplaceAll("/t", "");

                        DispText.CombatMsg = samsg;
                    }
                };
                if (UAFUtil.IsEmpty(DispText.CombatMsg)) {
                    if (UAFUtil.IsEmpty(damageComputation.Message())) {
                        if (toHitComputation.IsBackStab()) {
                            DispText.CombatMsg = "Rolls " + toHitComputation.Rolled() + " and BackStabs for " + damageComputation.Damage() + " dmg";
                        }
                        else {
                            DispText.CombatMsg = "Rolls " + toHitComputation.Rolled() + " and hits for " + damageComputation.Damage() + " dmg";
                        }
                    }
                    else {
                        DispText.CombatMsg = damageComputation.Message();
                    };
                }
            };
            // Condition added 20110413 PRS......
            // Manikus said that auto combatants should get multiple attacks even after a successful hit.
            //continueAttack=FALSE;

            // Changed again 20110522.
            // Manikus tells me that multiple attacks should ALWAYS be possible
            // if (!OnAuto(false)) continueAttack=FALSE; else continueAttack=TRUE;
        }
        else {
            toHitComputation.SetSuccessful(0);
        };
    }
    else {
        toHitComputation.SetSuccessful(0);
    };
    if (!toHitComputation.GetSuccessful()) {
/*#ifdef TraceFreeAttacks
        {
            WriteDebugString("TFA - %s failed to hit %s; numberAttacks=%d; availAttacks=%d\n",
                GetName(), targCOMBATANT -> GetName(), int(GetNbrAttacks()), int(availAttacks));
        };
#endif*/
        this.PlayMiss();
        if (toHitComputation.IsBackStab()) {
            DispText.CombatMsg = "Rolls " + toHitComputation.Rolled() + " amd fails BackStab";
        }
        else {
            DispText.CombatMsg = "Rolls " + toHitComputation.Rolled() + " and misses";
        };
        continueAttack = true;
    }
    UIEventManager.UpdateCombatMessage();




    if (toHitComputation.GetSuccessful()) {
    }
    else {
    };
    FormattedText.combatTextData = FormattedText.FormatCombatText(FormattedText.combatTextData, DispText.CombatMsg);

    if (decQty)  // wpn and giID refer to either the weapon or the ammo consumed by the weapon
    {
        // dec item qty by 1, item won't show up in post-combat treasure list
        if (wpn != NO_READY_ITEM) {
            if (wpnConsumesSelfAsAmmo) {
                var myItem = new ITEM();
                myItem = this.m_pCharacter.myItems.GetItem(wpn);
                myItem.qty = 1;
                combatData.hurledWeapons.AddItem(myItem);
            };
            this.m_pCharacter.myItems.AdjustQty(wpn, -1);
            if (!this.m_pCharacter.myItems.HaveItem(itemID)) // if deleted because of zero quantity
            // 20110519 PRS  if (!myItems.HaveItem(*(GLOBAL_ITEM_ID*)&wpn)) // if deleted because of zero quantity
            {
                // item removed, disable special abilities granted by it (if any)
                var pItem = itemData.GetItemFromID(itemID);
                if (pItem != null) {
                    var actor;
                    var hookParameters = new HOOK_PARAMETERS();
                    var scriptContext = new SCRIPT_CONTEXT();
                    actor = GetContextActor();
                    RunTimeIF.SetCharContext(actor);
                    scriptContext.SetCharacterContext(this.m_pCharacter);
                    this.m_pCharacter.RunCharacterScripts(
                        SPECAB.ON_USE_LAST_WEAPON,
                        SPECAB.ScriptCallback_RunAllScripts,
                        null,
                        "Decrement weapon or ammo count");
                    RunTimeIF.ClearCharContext();
                };
            };

            // re-calculate movement/encumbrance
            this.SetEncumbrance(this.determineEffectiveEncumbrance());
            this.determineMaxMovement();
        }
    }


    // make sure combatants are facing towards each other
    this.FaceOpponent(targ);
    if (!toHitComputation.IsBackStab()) targCOMBATANT.FaceOpponent(this.self);


    targCOMBATANT.m_iLastAttacker = this.self;
    targCOMBATANT.m_eLastAction = LASTACTION.LA_Defend;
    this.m_iLastAttacked = targCOMBATANT.self;
    this.m_eLastAction = LASTACTION.LA_Attack;


    RunTimeIF.ClearTargetContext();
    RunTimeIF.ClearCharContext();
    return -1;
}

COMBATANT.prototype.MakeTargetKey = function (dude, dist) {
    return ((dist << 16) | dude);
}

COMBATANT.prototype.ModifyAttackRollDice = function(pTarget, num, sides, pBonus) {
    return this.m_pCharacter.ModifyAttackRollDice(pTarget, num, sides, pBonus);
}

COMBATANT.prototype.ModifyAttackRollDiceAsTarget = function(pAttacker, num, sides, pBonus) {
  return this.m_pCharacter.ModifyAttackRollDiceAsTarget(pAttacker, num, sides, pBonus);
}

COMBATANT.prototype.ModifyAttackRollDiceForItem = function(pTarget, itemID, num, sides, pBonus, distance) {
    return this.m_pCharacter.ModifyAttackRollDiceForItem(pTarget, itemID, num, sides, pBonus, distance);
}

COMBATANT.prototype.ModifyAttackRollDiceForItemAsTarget = function(pAttacker, itemID, num, sides, pBonus) {
    return this.m_pCharacter.ModifyAttackRollDiceForItemAsTarget(pAttacker, itemID, num, sides, pBonus);
}

COMBATANT.prototype.GetAttackBonus = function (weaponID, distance) {
    var bonus = 0;

    if (this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0) != NO_READY_ITEM) {
        var idata = itemData.GetItemFromID(this.m_pCharacter.myItems.GetItem(this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0)));
        if (idata != null) {
            bonus += idata.Attack_Bonus;
        }
        else {
            Globals.WriteDebugString("Bogus item num in GetAttackBonus()\n");
        }
    }

    bonus += this.GetAdjHitBonus(weaponID, distance);

    return bonus;
}

COMBATANT.prototype.GetAdjHitBonus = function(weaponID, distance, flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjHitBonus(weaponID, distance, flags);
}

COMBATANT.prototype.GetAdjAC = function(flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjAC(flags);
}



COMBATANT.prototype.ModifyACAsTarget = function(pAttacker, pAC, itemID) {
    var src = 0;  // DWORD
    var spellID = "";
    var result = this.m_pCharacter.ModifyACAsTarget(pAttacker, pAC, itemID); var modify = result.returnVal; var pAC = result.pAC;   // PORT NOTE: Dealing with pass-by-reference parameters

    result = this.GetAdjSpecAb(SPECAB.SA_Displacement, src, spellID); src = result.pSource, spellID = result.pSpellName;
    if (result.returnVal) {
        var pa = pAttacker.m_pCombatant;
        this.m_pCharacter.QueueUsedSpecAb(SPECAB.SA_Displacement, src, spellID);
        modify = true;
        if (pa.self != this.m_iLastAttacker) // if first attack on me
          pAC = 21; // force a miss
        else
          pAC -= 2; // +2 bonus to armor class
    }

    var result = this.GetAdjSpecAb(SPECAB.SA_MirrorImage, src, spellID); src = result.pSource, spellID = result.pSpellName;
    if (result.returnVal) {
        this.m_pCharacter.QueueUsedSpecAb(SPECAB.SA_MirrorImage, src, spellID);
        modify = true;
        pAC = 21; // force a miss
    }

    if (pAttacker.HasDwarfACPenalty()) {
        if (raceData.HasDwarfResistance(this.race())) {
            pAC -= 4; // +4 bonus to armor class
            modify = true;
        }
    }
    if (pAttacker.HasGnomeACPenalty()) {
        if (raceData.HasGnomeResistance(this.race())) {
            pAC -= 4; // +4 bonus to armor class    
            modify = true;
        }
    }
    return { returnVal: modify, pAC: pAC };
}


COMBATANT.prototype.GetAdjSpecAb = function (sa, pSource, pSpellName) {
    if (!pSource) { pSource = null; }
    if (!pSpellName) { pSpellName = null; }
    return this.m_pCharacter.GetAdjSpecAb(sa, pSource, pSpellName);
}

COMBATANT.prototype.PlayMiss = function() {
//#ifdef newCombatant                                   // PORT NOTE:  I believe this is on
    if (this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0) != NO_READY_ITEM) {
        itemData.PlayMiss(this.m_pCharacter.myItems.GetItem(m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0)));
    }
//#else
//    if (myItems.GetReadiedItem(WeaponHand, 0) != NO_READY_ITEM) {
//        //itemData.PlayMiss(myItems.GetItem(myItems.GetReady(WeaponHand)));
//        itemData.PlayMiss(myItems.GetItem(myItems.GetReadiedItem(WeaponHand, 0)));
//    }
//#endif
  else
    {
        if (this.GetType() == MONSTER_TYPE)
            monsterData.PlayMiss(this.m_pCharacter.monsterID);
        else
            Globals.PlayCharMiss();
    }
}

COMBATANT.prototype.FaceOpponent = function(opponent) {
    var pOpponent;
    pOpponent = Globals.GetCombatantPtr(opponent);
    Globals.ASSERT(pOpponent != null, "pOpponent != null");
    if (pOpponent == null) return;
    var ax = pOpponent.x;
    var ay = pOpponent.y;
    var dir;

    // get direction to attacker
    if (this.x > ax) // nw, w, sw
    {
        if (this.y > ay) dir = PATH_DIR.PathNW;
        else if (this.y < ay) dir = PATH_DIR.PathSW;
        else dir = PATH_DIR.PathWest;
    }
    else if (this.x < ax) // ne, e, se
    {
        if (this.y > ay) dir = PATH_DIR.PathNE;
        else if (this.y < ay) dir = PATH_DIR.PathSE;
        else dir = PATH_DIR.PathEast;
    }
    else // x == ax
    {
        if (this.y > ay) dir = PATH_DIR.PathNorth;
        else if (this.y < ay) dir = PATH_DIR.PathSouth;
        else dir = PATH_DIR.PathBAD; // curr == dest
    }

    // if backstabbing, don't face attacker
    this.FaceDirection(dir);
}

COMBATANT.prototype.FaceDirection = function(dir)
{
    // translate attacker direction into
    // east/west icon facing
    switch (dir) {
        case PATH_DIR.PathNW:
            this.m_iMoveDir = FACE_NW;
            this.m_iFacing = FACE_WEST;
            break;
        case PATH_DIR.PathWest:
            this.m_iMoveDir = FACE_WEST;
            this.m_iFacing = FACE_WEST;
            break;
        case PATH_DIR.PathSW:
            this.m_iMoveDir = FACE_SW;
            this.m_iFacing = FACE_WEST;
            break;
        case PATH_DIR.PathNE:
            this.m_iMoveDir = FACE_NE;
            this.m_iFacing = FACE_EAST;
            break;
        case PATH_DIR.PathEast:
            this.m_iMoveDir = FACE_EAST;
            this.m_iFacing = FACE_EAST;
            break;
        case PATH_DIR.PathSE:
            this.m_iMoveDir = FACE_SE;
            this.m_iFacing = FACE_EAST;
            break;

        default:
            // if north/south attacker, no need to change facing.
            break;
    }
}


COMBATANT.prototype.InstantSpellActivate = function (attackSpellID, itemSpellID, target, pToHitComputation) {
    if (UAFUtil.IsEmpty(attackSpellID) && UAFUtil.IsEmpty(itemSpellID)) return;
    if (!UAFUtil.IsEmpty(attackSpellID) && !UAFUtil.IsEmpty(attackSpellID)) return;
    if (!UAFUtil.IsEmpty(itemSpellID) && !UAFUtil.IsEmpty(itemSpellID)) return;
    if (target == NO_DUDE) return;

    var pTarget = Globals.GetCombatantPtr(target);
    if (pTarget == null) {
        Globals.die(0xab4c2);
        return;
    }

    var pSdata = null;
    if (!UAFUtil.IsEmpty(attackSpellID)) pSdata = spellData.GetSpell(attackSpellID);
    if (!UAFUtil.IsEmpty(itemSpellID)) pSdata = spellData.GetSpell(itemSpellID);
    if (pSdata == null) {
        Globals.die(0xab4c3);
        return;
    }

    this.m_spellIDBeingCast = attackSpellID;
    this.m_itemSpellIDBeingCast = itemSpellID;
    this.Wpn_Type = weaponClassType.NotWeapon;
    {
        var result = 0;
        result = this.InvokeSpellOnCombatant(self, target, -1, pToHitComputation);
    }
}


COMBATANT.prototype.GetDamageDice = function(wpn, pNum, pSides, pBonus, pNonLethal, IsLarge, pSpellName)  {
    pNonLethal = false;
    pSpellName = "";
    if (wpn != NO_READY_ITEM) {
        var idata = itemData.GetItemFromID(this.m_pCharacter.myItems.GetItem(wpn));

        if (idata != null) {      
            pNonLethal = idata.IsNonLethal;

            if (IsLarge) {
               pNum = idata.Nbr_Dice_Lg;
               pSides = idata.Dmg_Dice_Lg;
               pBonus = idata.Dmg_Bonus_Lg + this.GetAdjDmgBonus() + idata.Attack_Bonus;
            }
            else {
               pNum = idata.Nbr_Dice_Sm;
               pSides = idata.Dmg_Dice_Sm;
               pBonus = idata.Dmg_Bonus_Sm + this.GetAdjDmgBonus() + idata.Attack_Bonus;
            }
        }
        else {
            Globals.WriteDebugString("Bogus item num in GetDamageDice()\n");
        }
    }
    else {
        if (this.GetType() == MONSTER_TYPE) {
            var nbrAttacks = this.GetNbrAttacks();
            var currAttack = nbrAttacks - this.availAttacks;
            if ((currAttack < 0) || (currAttack >= nbrAttacks)) currAttack = 0;

            pMonster = monsterData.PeekMonster(this.m_pCharacter.monsterID);
            Globals.ASSERT(pMonster != null, "pMonster != NULL");

            if (pMonster == null) {
                pNum   = this.m_pCharacter.unarmedNbrDieL;
                pSides = this.m_pCharacter.unarmedDieL;
                pBonus = this.GetAdjDmgBonus();
                return;
            }

            if (pMonster.attackData.GetMonsterAttackDetailsCount() == 0) {
                Globals.WriteDebugString("Monster " + pMonster.Name + " has zero attacks defined\n");
                pNum   = this.m_pCharacter.unarmedNbrDieL;
                pSides = this.m_pCharacter.unarmedDieL;
                pBonus = this.GetAdjDmgBonus();
                return;
            }

            if ((currAttack < 0) || (currAttack >= pMonster.attackData.GetMonsterAttackDetailsCount()))
                currAttack = 0;

            pNum = pMonster.attackData.PeekMonsterAttackDetails(currAttack).nbr;
            pSides = pMonster.attackData.PeekMonsterAttackDetails(currAttack).sides;
            pBonus = pMonster.attackData.PeekMonsterAttackDetails(currAttack).bonus;
            pSpellName = pMonster.attackData.PeekMonsterAttackDetails(currAttack).spellID;
        }
        else {
            if (IsLarge) {
                pNum   = this.m_pCharacter.unarmedNbrDieL;
                pSides = this.m_pCharacter.unarmedDieL;
                pBonus = this.GetAdjDmgBonus();
            }
            else {
                pNum   = this.m_pCharacter.unarmedNbrDieS;
                pSides = this.m_pCharacter.unarmedDieS;
                pBonus = this.m_pCharacter.unarmedBonus + this.GetAdjDmgBonus();
            }
        }
    }
    return {
        pNum: pNum,
        pSides: pSides,
        pBonus: pBonus,
        pNonLethal: pNonLethal,
        pSpellName: pSpellName
    };

}

COMBATANT.prototype.ModifyAttackDamageDice = function (pTarget, num, sides, pBonus, pNonLethal) {
    return this.m_pCharacter.ModifyAttackDamageDice(pTarget, num, sides, pBonus, pNonLethal);
}

COMBATANT.prototype.isLargeDude = function() {
    var ctype = this.GetAdjSize();
    if (ctype == creatureSizeType.Large) return true;
    if ((this.width > 1) || (this.height > 1)) return true;
    if (this.IsAlwaysLarge()) return true;
    return false;
}

COMBATANT.prototype.GetAdjSize = function(flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjSize(flags);
}


COMBATANT.prototype.IsAlwaysLarge = function() {
    return this.m_pCharacter.IsAlwaysLarge();
}

COMBATANT.prototype.GetAdjDmgBonus = function(flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjDmgBonus(flags);
}

COMBATANT.prototype.ModifyAttackDamageDiceForItem = function (pTarget, itemID, num, sides, pBonus, pNonLethal, distance) {
    return this.m_pCharacter.ModifyAttackDamageDiceForItem(pTarget, itemID, num, sides, pBonus, pNonLethal, distance);
}

COMBATANT.prototype.ModifyAttackDamageDiceAsTarget = function(pAttacker, num, sides, pBonus, pNonLethal) {
  return this.m_pCharacter.ModifyAttackDamageDiceAsTarget(pAttacker, num, sides, pBonus, pNonLethal);
}

COMBATANT.prototype.ModifyAttackDamageDiceForItemAsTarget = function(pAttacker, itemID, num, sides, pBonus, pNonLethal, toHitRolled) {
    var pItem = itemData.GetItemFromID(itemID);
    if (pItem == null) return { pBonus: pBonus, pNonLethal: pNonLethal };

    var src = 0;   // DWORD
    var spellID = "";
    var result = m_pCharacter.ModifyAttackDamageDiceForItemAsTarget(pAttacker, itemID, num, sides, pBonus, pNonLethal);
    pBonus = result.pBonus;
    pNonLethal = result.pNonLethal;

    var pa = pAttacker.m_pCombatant;
    // if vorpal item readied (attacker has ability enabled), and using item that confers ability
    if ((toHitRolled == 20)
        && (pa.GetAdjSpecAb(SA_VorpalAttack, src, spellID))
        && (pItem.specAbs.HaveSpecAb(SPECAB.SA_VorpalAttack))) {
        if (!this.HasVorpalImmunity()) {
            pBonus = this.GetHitPoints() + 1; // make sure this attack kills target
            pa.m_pCharacter.QueueUsedSpecAb(SPECAB.SA_VorpalAttack, src, spellID);
        }
    }
    return { pBonus: pBonus, pNonLethal: pNonLethal };
}

COMBATANT.prototype.PlayHit = function() {
    if (this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0) != NO_READY_ITEM)
    {
        itemData.PlayHit(this.m_pCharacter.myItems.GetItem(this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0)));
    }
    else
    {
        if (this.GetType() == MONSTER_TYPE)
            monsterData.PlayHit(this.m_pCharacter.monsterID);
        else
            Globals.PlayCharHit();
    }
}

COMBATANT.prototype.TakeDamage = function(dmg, IsNonLethal, invokeOptions, canFinishCasting, pDeathIndex)
{
    // don't beat a dead horse!
    // *but!* allow dying to take 1 hp damage per turn if not yet bandaged
    //
    var stype = this.GetAdjStatus();
    if ((stype == charStatusType.Fled)
        || (stype == charStatusType.Gone)
        || (stype == charStatusType.TempGone)
        || (stype == charStatusType.Dead))
        return pDeathIndex;

    if (IsNonLethal) dmg = 0;

    // adjust raw hitpoints
    this.SetHitPoints(this.GetHitPoints() - dmg);

    var trueHp = this.GetHitPoints();
    var startTrueHp = trueHp;

    // can't go below -10
    // and 10 = dead
    if (trueHp < -10)
        trueHp = -10;

    if (!this.IsPartyMember()) {
        // monster die when hp reaches zero
        if (trueHp <= 0)
            trueHp = -10;
        // unless configured to not die
        if ((trueHp < 1) && (Globals.GetConfigMonsterNoDeath())) // debug flag
            trueHp = 1;
        if ((trueHp < 1) && (this.HasDeathImmunity())) // monster immunity flag
            trueHp = -10;
    }

    // set to modified value if needed
    if (trueHp != startTrueHp)
        this.SetHitPoints(trueHp);

    // now get adjusted hp value, which can
    // magically change the current hp
    //
    var adjHp = this.GetAdjHitPoints();

    if (!this.IsPartyMember()) {
        // 20120605  PRS I changed this to avoid the ASSERT about 25 lines below.
        // It also agress with the code about 21 lines above.
        if (adjHp <= 0)
            adjHp = -10;

        // still can't let monsters die, even if hp is 
        // magically below 0
        if ((adjHp < 1) && (Globals.GetConfigMonsterNoDeath()))
            adjHp = 1;
        if ((adjHp < 1) && (this.HasDeathImmunity())) // monster immunity flag
            adjHp = -10;
    }

    if (adjHp <= -10) {
        this.SetStatus(charStatusType.Dead);
        if (Drawtile.getCombatantInCell(this.x, this.y, 1, 1, NO_DUDE) == this.self) {
            Drawtile.placeCombatant(this.x, this.y, NO_DUDE, this.width, this.height);
        };
        Drawtile.placeDyingCombatant(this.x, this.y, NO_DUDE, this.width, this.height);
        UIEventManager.CombatantDead(this.self, this.x, this.y);
        Globals.TRACE(this.self + " takes " + dmg + " hp damage, -10 left, and is dead\n");
        if ((invokeOptions != null) && (invokeOptions.m_supressBlitSprite & WhatSprite.DeathSprite)) {
            invokeOptions.m_whatSpriteNeeded |= WhatSprite.DeathSprite;
        }
        else {
            if (pDeathIndex != null) {
                pDeathIndex = this.self;
            }
            else {
                this.blitDeadSprite();
            }
        }
    }
    else if (adjHp <= 0) {
        Globals.ASSERT(this.IsPartyMember(), "IsPartyMember()");
        if (Drawtile.getCombatantInCell(this.x, this.y, 1, 1, NO_DUDE) == this.self) {
            Drawtile.placeCombatant(this.x, this.y, NO_DUDE, this.width, this.height);
        };
        Drawtile.placeDyingCombatant(this.x, this.y, this.self, this.width, this.height);
        UIEventManager.CombatantDying(this.self, this.x, this.y);
        this.SetStatus(charStatusType.Dying);
        this.isBandaged = false;
        this.bandageWho = -1;
        Globals.TRACE(this.self + " takes " + dmg + " hp damage, " + adjHp + " left, and is dying\n");
        if ((invokeOptions != null) && (invokeOptions.m_supressBlitSprite & WhatSprite.DyingSprite)) {
            invokeOptions.m_whatSpriteNeeded |= WhatSprite.DyingSprite;
        }
        else {
            this.blitDyingSprite();
        };
    }

    if (adjHp <= 0) {
        // update stats used for monster morale
        if (this.friendly)
            Globals.IncNumFriendSlain();
        else
            Globals.IncNumMonsterSlain();

        // if dead, this dude can't do anything else    
        this.StopCasting(true, false); // also calls EndTurn()
        this.m_iMovement = this.GetAdjMaxMovement(DEFAULT_SPELL_EFFECT_FLAGS, "Combatant HP < 0");
    }
    else if (dmg > 0) // cancel any pending spell casting if damage taken
    {
        this.StopCasting(false, canFinishCasting); // does not call EndTurn()
    };

    this.UpdateSpellForDamage(dmg);
    return pDeathIndex;
}

COMBATANT.prototype.SetHitPoints = function (val) {
    this.m_pCharacter.SetHitPoints(val);
}

COMBATANT.prototype.GetHitPoints = function () {
    return this.m_pCharacter.GetHitPoints();
}

COMBATANT.prototype.UpdateSpellForDamage = function (DamageTaken) {
    this.m_pCharacter.UpdateSpellForDamage(DamageTaken);
};

COMBATANT.prototype.HasDeathImmunity = function () {
    return this.m_pCharacter.HasDeathImmunity();
}

COMBATANT.prototype.EndTurn = function(newState) {
    if (!newState) { newState = individualCombatantState.ICS_None; }

    this.State(newState);
    var qcomb = Globals.GetQueuedCombatants();

    if (qcomb.Top() == this.self) {
        if (qcomb.ChangeStats() || qcomb.NumFreeAttacks() || qcomb.NumGuardAttacks()) {
            Globals.TRACE("EndTurn(" + this.CombatantStateText[this.State()] + "), " + this.self + " done\n");
            turnIsDone = true;
        }
        else
            Globals.TRACE("EndTurn(" + this.CombatantStateText[this.State()] + "), " + this.self + " (no change to done)\n");

        // input was disabled if auto combatant
        Globals.EnableUserInput(true);
        //  PRS  20110219                         //*
        if (qcomb.NumFreeAttacks() || qcomb.NumGuardAttacks())             //*
        {                                         //*
            combatData.m_forceRoundDelay = true;    //*
        };                                        //*
        qcomb.Pop();
        if (qcomb.Top() != NO_DUDE) {
            if (qcomb.DelayedX() >= 0) {
                var delayedDude;
                var pDelayedCombatant;
                if (Drawtile.terrain[qcomb.DelayedY()][qcomb.DelayedX()].tileIndex != NO_DUDE) {
                    /* Really */ Globals.NotImplemented(0x34c1, false);
                }
                delayedDude = qcomb.Top();
                pDelayedCombatant = combatData.GetCombatant(delayedDude);
                Drawtile.placeCombatant(pDelayedCombatant.x,
                    pDelayedCombatant.y,
                    NO_DUDE,
                    pDelayedCombatant.width,
                    pDelayedCombatant.height);
                pDelayedCombatant.x = qcomb.DelayedX();
                pDelayedCombatant.y = qcomb.DelayedY();
                qcomb.SetXY(-1, -1);
                Drawtile.placeCombatant(pDelayedCombatant.x,
                    pDelayedCombatant.y,
                    delayedDude,
                    pDelayedCombatant.width,
                    pDelayedCombatant.height);
            }
        }
    }
    else {
        qcomb.Remove(this.self);
        if (qcomb.DelayedX() >= 0) {
        /* Really */Globals.NotImplemented(0x43c6, false);
        };
        Globals.TRACE("Forced EndTurn(" + this.CombatantStateText[this.State()] + "), " + this.self + " done\n");
        turnIsDone = true;
    }
    forceAttackPose = false;
    this.OnEndTurn();
}

COMBATANT.prototype.RemoveCurrTarget = function () {
    if (!this.combattargets.IsEmpty())
        this.combattargets.RemoveHead();

    this.SetCurrTarget();
}

COMBATANT.prototype.blitDyingSprite = function () {
    UIEventManager.CombatantDying(this.self, this.x, this.y);
}

COMBATANT.prototype.CheckMorale = function () {
    if ((this.iFleeingFlags != 0) || this.isTurned)
        return;

    // monsters with no INT never flee
    if ((this.GetType() == MONSTER_TYPE) && (this.GetAdjInt() <= 1))
        return;

    var fflee = 0;    // PORT NOTE:  static
    var fslain = 0;   // PORT NOTE:  static
    var mflee = 0;    // PORT NOTE:  static
    var mslain = 0;   // PORT NOTE:  static
    var SuperiorForceModMade = false;

    var mod = 0;
    var numParty = 0, numMons = 0;
    var Flee = false;

    var returnVal = Globals.GetNumCombatants(numParty, numMons);
    numParty = returnVal.pNumParty;
    numMons = returnVal.pNumMons;

    if (this.friendly) {
        if (fflee != Globals.GetNumFriendFlee())
            mod += ((Globals.GetNumFriendFlee() - fflee) * 5);
        if (fslain != Globals.GetNumFriendSlain())
            mod += ((Globals.GetNumFriendSlain() - fslain) * 10);
        if (((numParty * 3) <= numMons) && (!SuperiorForceModMade)) {
            mod += 20;
            SuperiorForceModMade = true;
        }
    }
    else {
        if (mflee != Globals.GetNumMonsterFlee())
            mod += ((Globals.GetNumMonsterFlee() - mflee) * 5);
        if (mslain != Globals.GetNumMonsterSlain())
            mod += ((Globals.GetNumMonsterSlain() - mslain) * 10);
        if (((numMons * 3) <= numParty) && (!SuperiorForceModMade)) {
            mod += 20;
            SuperiorForceModMade = true;
        }
    }

    /* *********************************************************
      *   The following email from Manikus  20181102
      * Good afternoon.
      * I would like the Morale value to not autochange. 
      * if I can GET 1) total Morale and 2) Combat Morale, 
      * OR 1) Morale set in editor (monster or NPC) and 
      * 2) Combat Morale, I will be happy.
      * I also think I will want the function to match with the 
      * AdjustInitiative Hook parameters.
      * 
      * -Eric
      ********************************************************* */

    Flee = false;

    if (Flee) {
        // only auto combatants choose to flee
        if (this.OnAuto(false)) {
            if (!this.IsPartyMember()) {
                if (!Globals.GetConfigMonsterNoFlee())
                    this.iFleeingFlags |= fleeBecauseImpossible;
            }
            else
                this.iFleeingFlags |= fleeBecauseImpossible;
        }
    }

    if (this.iFleeingFlags != 0) {
        this.ClearPath();
        this.RemoveAllTargets();
        this.SetStatus(Running);
        this.State(ICS_Moving);
        // stop any casting in progress
        this.StopCasting(false, false);
    }

    fflee = Globals.GetNumFriendFlee();
    fslain = Globals.GetNumFriendSlain();
    mflee = Globals.GetNumMonsterFlee();
    mslain = Globals.GetNumMonsterSlain();
}


COMBATANT.prototype.GetAdjInt = function (flags) {
    if (!flags) { flags = DEFAULT_SPELL_EFFECT_FLAGS; }
    return this.m_pCharacter.GetAdjInt(flags);
}


COMBATANT.prototype.charCanTakeAction = function() {
    var stype = this.GetAdjStatus();
    if ((stype == charStatusType.Okay) || (stype == charStatusType.Running) || (stype == charStatusType.Animated))
        return true;
    return false;
}

COMBATANT.prototype.RollInitiative = function (eSurprise) {
    var partymember = (this.IsPartyMember() || this.friendly);
    switch (eSurprise) {
        case eventSurpriseType.Neither:
            this.m_iInitiative = Globals.RollDice(INITIATIVE.INITIATIVE_LastDefault - INITIATIVE.INITIATIVE_FirstDefault + 1, 1, INITIATIVE.INITIATIVE_FirstDefault - 1);
            break;
        case eventSurpriseType.PartySurprised: // monsters go first
            this.m_iInitiative = (partymember ? INITIATIVE.INITIATIVE_LastDefault : INITIATIVE.INITIATIVE_FirstDefault);
            break;
        case eventSurpriseType.MonsterSurprised: // party members go first
            this.m_iInitiative = (partymember ? INITIATIVE.INITIATIVE_FirstDefault : INITIATIVE.INITIATIVE_LastDefault);
            break;
    }

    if (this.m_iInitiative < INITIATIVE.INITIATIVE_FirstDefault) this.m_iInitiative = INITIATIVE_FirstDefault;
    if (this.m_iInitiative > INITIATIVE.INITIATIVE_LastDefault) this.m_iInitiative = INITIATIVE_LastDefault;
}

COMBATANT.prototype.OnStartCombatantAction = function() {
    var hookParameters = new HOOK_PARAMETERS();
    var scriptContext = new SCRIPT_CONTEXT();
    var actor;
    Globals.TRACE("OnStartCombatantAction for " + this.self + "\n");
    this.ClearQueuedSpecAb();
    Globals.PlaceCursorOnCurrentDude();

    DispText.CombatMsg = "";
    FormattedText.ClearFormattedText(FormattedText.combatTextData);
    var tmp;


    actor = this.GetContextActor(actor);
    RunTimeIF.SetCharContext(actor);
    scriptContext.SetCharacterContext(this.m_pCharacter);
    scriptContext.SetCombatantContext(this);
    this.RunCombatantScripts(
        SPECAB.ON_START_COMBATANT_ACTION,
        SPECAB.ScriptCallback_RunAllScripts,
        null,
        "Start Combatant Action");
    RunTimeIF.ClearCharContext();
}

COMBATANT.prototype.ClearQueuedSpecAb = function() {
    this.m_pCharacter.ClearQueuedSpecAb();
};

COMBATANT.prototype.UpdateCombatant = function() {
    var onAuto;
    var oldState = this.State();
    onAuto = this.OnAuto(true);

    if (onAuto) {
        if (this.m_ICS != individualCombatantState.ICS_Casting)  // No need to think if already casting
        {
            if (combatData.IsFreeAttacker()) {
                return;  // No need to Think
            };
            if (!this.Think())
                return;
        };
    };


    if ((this.State() != individualCombatantState.ICS_None) && (this.State() != oldState)) {
        Globals.TRACE("done updating " + (onAuto ? "auto" : "manual") + " combatant " + this.self + " (" + this.CombatantStateText[this.State()] + ")\n");
    }
    return;
}

COMBATANT.prototype.OnAuto = function (callAutoActionHook) {
    // We want to call the hook only at those points in
    // the combat where it makes sense for 'auto action' to have changed.
    // Otherwise we call the hook hundreds of times (for example from OnIdle).

    if (callAutoActionHook) {
        var actor;
        var hookParameters = new HOOK_PARAMETERS();
        var scriptContext = new SCRIPT_CONTEXT();
        actor = this.GetContextActor();
        RunTimeIF.SetCharContext(actor);
        scriptContext.SetCombatantContext(this);

        this.RunCombatantScripts(SPECAB.AUTO_ACTION,
            SPECAB.ScriptCallback_RunAllScripts,
            null,
            "Combatant Auto-action may have changed");
        RunTimeIF.ClearCharContext();

        while (!UAFUtil.IsEmpty(hookParameters[0])) {
            var col;
            this.iFleeingFlags &= ~FLEEING_FLAGS.fleeAutoActionScript;
            this.iAutoFlags &= ~AUTO_FLAGS.forceAutoScript;
            this.iAutoFlags &= ~AUTO_FLAGS.forcePlayerScript;
            switch (hookParameters[0][0]) {
                case 'F':
                    // We probably need to clear 'fleeAutoActionScript' when we 'GetNextCombatant'
                    // so that the fleeing can be terminated when a spell effect ends.
                    this.iFleeingFlags |= fleeAutoActionScript;
                    if (hookParameters[0].GetLength() > 1) {
                        var attacker = parseInt(hookParameters[0][1]);
                        if (!isNaN(attacker)) {
                            if ((attacker >= 0) && (attacker < combatData.NumCombatants())) {
                                if (attacker != this.self) {
                                    this.m_iLastAttacker = attacker;
                                };
                            };
                        };
                    };
                    break;
                case 'C':
                    if (hookParameters[0].GetLength() > 1) {
                        if (hookParameters[0][1] == 'P') this.iAutoFlags |= AUTO_FLAGS.forcePlayerScript;
                        if (hookParameters[0][1] == 'A') this.iAutoFlags |= AUTO_FLAGS.forceAutoScript;
                    };
                    break;
            };
            col = hookParameters[0].indexOf(',');
            if (col < 0) hookParameters[0] = "";
            else hookParameters[0] = hookParameters[0].substring(col);
        }
    }


    if (this.iFleeingFlags != 0) return true;
    if (this.iAutoFlags & AUTO_FLAGS.forceAutoScript) return true;
    if (this.iAutoFlags & AUTO_FLAGS.forcePlayerScript) return false;

    if ((this.friendly && (this.m_adjFriendly == 2))
        || (this.m_adjFriendly == 3)
    ) {
        return true;
    }

    if (this.GetAdjAutomatic()) {
        return true;
    }

    return false;
}



COMBATANT.prototype.Think = function () {
    //8a0c
    // no user input allowed while dude is on auto
    var actionIndex = [];
    var useScriptedAI = false;
    var bestWeaponIdx = 0;
    if (this.IsPartyMember())
        Globals.EnableUserInput(true);
    else {
        Globals.EnableUserInput(false);
    }
    Globals.TRACE("thinking for auto combatant " + this.self + " (" + this.CombatantStateText[this.State()] + ")\n");

    // make sure current path has not been exhausted
    if (this.hPath >= 0) {
        if (pathMgr.GetStepsRemaining(this.hPath) == 0)
            this.ClearPath();
    }

    if (this.iFleeingFlags != 0) {
        this.State(individualCombatantState.ICS_Moving);
        Globals.TRACE("thinking result for auto combatant " + this.self + " (" + this.CombatantStateText[this.State()] + "=fleeing)\n");
        // find path to closest map edge

        var fled = false;
        // if already on map edge, flee off the map
        if ((x == 0) || (x == (Drawtile.MAX_TERRAIN_WIDTH - 1))
            || (y == 0) || (y == (Drawtile.MAX_TERRAIN_HEIGHT - 1))) {
            fled = true;
        }

        if (fled) {
            if (this.friendly)
                Globals.IncNumFriendFlee(); //combatData.numFrndFlee++;
            else
                Globals.IncNumMonsterFlee(); //combatData.numMonFlee++;

            RunEvent.menu.setMenu(MENU_DATA_TYPE.EmptyMenuData, null, true, null, null); // starts empty
            RunEvent.menu.setHorzOrient();
            RunEvent.menu.setUseActive(false); // no highlighting      

            var msg = "";
            msg = this.GetName() + " has fled...";
            RunEvent.menu.changeMenuItem(1, msg);
            Screen.UpdateCombatTimeDelayMsg();
            theApp.AppSleep(Globals.GetMsgTimeDelay()); // give time to see normal icon      

            this.SetStatus(Fled);
            Drawtile.placeCombatant(x, y, NO_DUDE, width, height);
            Globals.TRACE("combatant " + this.self + " has fled the map\n");
            this.State(individualCombatantState.ICS_Fled); //BUGFIX
            Globals.EnableUserInput(false);
            return true;
        }
        if (this.CanMove(false)) {
            if (this.hPath < 0) {
                // find path to farthest corner of room away from cleric that turned me
                if (!FindPathAwayFrom(m_iLastAttacker)) {
                    Globals.WriteDebugString("Fleeing combatant " + this.self + " failed to find exit path\n");
                    this.State(individualCombatantState.ICS_Guarding);
                }
            }
        }
        else
            this.State(individualCombatantState.ICS_Guarding);
        return true;
    }

    if (this.isTurned) {
        this.State(individualCombatantState.ICS_Moving);
        Globals.TRACE("thinking result for auto combatant " + this.self + " (" + this.CombatantStateText[this.State()] + "=turned/fleeing " + this.m_iLastAttacker + ")\n");

        var fled = false;
        // if already on map edge, flee off the map
        if ((x == 0) || (x == (Drawtile.MAX_TERRAIN_WIDTH - 1))
            || (y == 0) || (y == (Drawtile.MAX_TERRAIN_HEIGHT - 1))) {
            fled = true;
        }

        if (fled) {
            if (this.friendly)
                Globals.IncNumFriendFlee(); //combatData.numFrndFlee++;
            else
                Globals.IncNumMonsterFlee(); //combatData.numMonFlee++;

            RunEvent.menu.setMenu(MENU_DATA_TYPE.EmptyMenuData, null, true, null, null); // starts empty
            RunEvent.menu.setHorzOrient();
            RunEvent.menu.setUseActive(false); // no highlighting      

            var msg = "";
            msg = this.GetName() + " has fled...";
            RunEvent.menu.changeMenuItem(1, msg);
            Screen.UpdateCombatTimeDelayMsg();
            theApp.AppSleep(GetMsgTimeDelay()); // give time to see normal icon      

            this.SetStatus(Fled);
            this.State(individualCombatantState.ICS_Fled); // BUGFIX
            Drawtile.placeCombatant(x, y, NO_DUDE, width, height);
            Globals.TRACE("Turned Undead " + this.self + " has fled the map\n");
            return true;
        }
        if (this.CanMove(false)) {
            if (this.hPath < 0) {
                // find path to farthest corner of room away from cleric that turned me
                if (!this.FindPathAwayFrom(this.m_iLastAttacker)) {
                    Globals.WriteDebugString("Fleeing combatant " + this.self + " failed to find exit path\n");
                    this.State(individualCombatantState.ICS_Guarding);
                }
            }
        }
        else
            this.State(individualCombatantState.ICS_Guarding);
        return true;
    }

    // make sure current target is still on the map
    useScriptedAI = false;
    this.m_pCharacter.ReadyWeaponScript(NO_READY_ITEM);
    this.m_pCharacter.ReadyShieldScript(NO_READY_ITEM);
    {
        if (this.LoadAI_Script()) {
            combatSummary.m_thinkCount++;
            combatSummary.Clear();  // Does not clear thinkcount
            combatData.ListCombatants(combatSummary, this, null);
            combatData.ListWeapons(combatSummary.GetCombatant(0)); // List weapons for attacker only.
            combatData.ListAmmo(combatSummary.GetCombatant(0));    // List ammo for attacker only.
            combatData.ListAttacks(combatSummary.GetCombatant(0), 0); // List attacks for attacker only.
            combatData.ListReachableCells(combatSummary, combatSummary.GetCombatant(0)); // Number of steps to each cell.
            combatData.ListActions(combatSummary, 0, 0, false);
            // Compare all the actions to find the very best one.
            // We could simply go down the list from one end to
            // the other, keeping track of the best one found and
            // comparing the current best to the next.
            // But let us instead place the actions in a binary 
            // tree such that at each node, the action at the top
            // is better than the two actions immediately below.
            // Then we can easily extract several actions if we
            // would like to choose randomly from the three best, 
            // for example.
            {
                var i = 0, j = 0, k = 0;
                actionIndex = []; for (i = 0; i < combatSummary.GetActionCount(); i++) { actionIndex[i] = 0;} }//PORT NOTE: Changed from SetSize
                for (i = 0; i < combatSummary.GetActionCount(); i++) {
                    actionIndex[i] = i;
                    // Move the new entry towards the top of the tree.
                    j = i;
                    while (j > 0) {
                        var temp;
                        k = (j - 1) / 2;
                        combatSummary.pActionA = combatSummary.GetAction(actionIndex[j]);
                        combatSummary.pActionB = combatSummary.GetAction(actionIndex[k]);
                        if (Forth.RunTHINK(thinkProgram.pgm, combatSummary) <= 0) break;
                        temp = actionIndex[j];
                        actionIndex[j] = actionIndex[k];
                        actionIndex[k] = temp;
                        j = k;
                    }
                }
                this.DumpActions(actionIndex, combatSummary, true);
                if (combatSummary.GetActionCount() > 0) {
                    useScriptedAI = true;
                }
                else {
                    this.State(individualCombatantState.ICS_Guarding);
                    Globals.TRACE("thinking result for auto combatant " + this.self + " (" + this.CombatantStateText[this.State()] + ") - no actions\n");
                    return true;
                }
            }
    }

    var dude = NO_DUDE;

    if (useScriptedAI) {
        if (combatSummary.m_thinkCount == 20) {
            Globals.ASSERT(true);
        }
        var actionType = combatSummary.PeekAction(actionIndex[0]).actionType;
        switch (actionType) {
            case ACTION_TYPE.AT_SpellLikeAbility:
            case ACTION_TYPE.AT_SpellCaster:
                {
                    var pCSA;
                    var itemIdx = 0;
                    combattargets.RemoveAll();
                    pCSA = combatSummary.PeekAction(actionIndex[0]);
                    itemIdx = pCSA.pMe.PeekWeapon(pCSA.weaponOrd - 1).index;
                    dude = combatSummary.PeekCombatant(pCSA.targetOrd - 1).index;
                    this.m_pCharacter.ReadyWeaponScript(itemIdx);
                    this.AddTarget(dude, false);
                    this.ReadyBestArmor();
                    {
                        this.State(individualCombatantState.ICS_Attacking);
                        itemIdx = this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0);
                        if (m_pCharacter.myItems.GetCharges(itemIdx) > 0) {
                            var pItem;
                            pItem = combatSummary.PeekCombatant(0).PeekWeapon(pCSA.weaponOrd - 1).pWeapon;
                            var pos;
                            pos = combattargets.GetHeadPosition();
                            if (pos != null) {
                                var pSpell;
                                var pSpData;
                                var pTarget;
                                var rollerLevel = -1;
                                var newSpell = new CHARACTER_SPELL();
                                var dir = new PATH_DIR();
                                pSpell = combatSummary.PeekCombatant(0).PeekWeapon(pCSA.weaponOrd - 1).pSpell;
                                pSpData = pSpell;
                                pTarget = this.GetCombatantPtr(dude);
                                combattargets.RemoveAll();
                                {
                                    var result = "";
                                    var hookParameters = new HOOK_PARAMETERS();
                                    var scriptContext = new SCRIPT_CONTEXT();
                                    scriptContext.SetSpellContext(pSpData);
                                    scriptContext.SetAttackerContext(this);
                                    result = pSpData.RunSpellScripts(
                                        SPECAB.SPELL_CASTER_LEVEL,
                                        SPECAB.ScriptCallback_RunAllScripts,
                                        null,
                                        "Combat AI - Can combatant use this spell");
                                    if (result.GetLength() > 0) {
                                        rollerLevel = parseInt(result);
                                        if (isNaN(rollerLevel)) { rollerLevel = -1;}  // PORT NOTE:  Reset to its initialized value if parseInt fails
                                    }
                                }

                                var targs = this.EvalDiceAsClass(pSpData.TargetQuantity(),
                                    pSpData.schoolID,
                                    pSpData.Level, 
                                    rollerLevel);
                                var range = this.EvalDiceAsClass(pSpData.TargetRange(),
                                    pSpData.schoolID,
                                    pSpData.Level, 
                                    rollerLevel);
                                var xSize = this.EvalDiceAsClass(pSpData.TargetWidth(),
                                    pSpData.schoolID,
                                    pSpData.Level, 
                                    rollerLevel);
                                var ySize = this.EvalDiceAsClass(pSpData.TargetHeight(),
                                    pSpData.schoolID,
                                    pSpData.Level, 
                                    rollerLevel);
                                this.m_pCharacter.InitTargeting(pSpData.Targeting,
                                    pSpData.CanTargetFriend,
                                    pSpData.CanTargetEnemy,
                                    false,
                                    targs,
                                    range,
                                    xSize,
                                    ySize,
                                    pSpData.Lingers);
                                this.m_itemSpellIDBeingCast = pSpData.SpellID();
                                this.Wpn_Type = pItem.Wpn_Type;
                                this.combatant_spellCastingLevel = rollerLevel;
                                this.m_spellIDBeingCast.Clear();
                                dir = PATH_DIR.GetSpellTargetingDir(this.GetCenterX(), this.GetCenterY(), pTarget.x, pTarget.y);
                                if (this.m_pCharacter.targets.m_SelectingUnits) {
                                    // 20200204 PRS  We set the target distance to 0.
                                    // Why?  Because it is irrelevant.  This action wuould not
                                    // have been listed (and chosen) if the target were 
                                    // beyond reach of the spell.
                                    this.C_AddTarget(pTarget, 0);
                                }
                                else {
                                    var dirX = 0, dirY = 0;
                                    dirX = pTarget.x - GetCenterX();
                                    dirY = pTarget.y - GetCenterY();
                                    this.AddMapTarget(pTarget.x, pTarget.y, dir, dirX, dirY);
                                };
                                this.State(individualCombatantState.ICS_Casting);
                                this.m_pCharacter.ClearSpellbook();
                                this.m_pCharacter.UseSpellLimits(false);
                                // We may have to do some fiddling here.
                                // Setting the caster baseclass and spell school to
                                // illegal values for now......
                                {
                                    var schoolID;
                                    var baseclassID;
                                    this.m_pCharacter.KnowSpell(baseclassID, schoolID, pSpData.SpellID(), 1, true);
                                }
                                this.m_pCharacter.myItems.SetCharges(itemIdx, m_pCharacter.myItems.GetCharges(itemIdx) - 1);
                                if (this.m_pCharacter.myItems.GetCharges(itemIdx) <= 0) {
                                    this.m_pCharacter.myItems.DeleteItem(itemIdx);
                                }
                            }
                        }
                        else {
                            this.m_pCharacter.myItems.DeleteItem(itemIdx);
                            this.State(individualCombatantState.ICS_Guarding);
                        };
                    }
                }
                return true;
            case ACTION_TYPE.AT_Advance:
                {
                    var found = false;
                    var pCSA;
                    combattargets.RemoveAll();
                    pCSA = combatSummary.PeekAction(actionIndex[0]);
                    dude = combatSummary.PeekCombatant(pCSA.targetOrd - 1).index;
                    this.AddTarget(dude, false);
                    {
                        {
                            var tempCOMBATANT;
                            this.ClearPath();
                            this.SetCurrTarget(); // setup for iteration
                            var targetCount = 0;
                            dude = this.GetCurrTarget(true, false, true);

                            while ((!found)
                                && (dude != NO_DUDE)
                                && (targetCount < this.GetNumTargets())) {
                                tempCOMBATANT = GetCombatantPtr(dude);
                                Globals.ASSERT(tempCOMBATANT != null);
                                if (tempCOMBATANT == null) return false;
                                if (this.FindPathTo(tempCOMBATANT.x - 1,
                                    tempCOMBATANT.y - 1,
                                    tempCOMBATANT.x + tempCOMBATANT.width,
                                    tempCOMBATANT.y + tempCOMBATANT.height,
                                    true,
                                    false,
                                    false)) {
                                    found = true;
                                    this.RemoveAllTargets();
                                    this.AddTarget(dude, false);
                                }
                                else {
                                    dude = this.GetNextTarget();
                                };
                                targetCount++;
                            };
                        };
                    };
                    if (found) {
                        this.State(individualCombatantState.ICS_Moving);
                        return true;
                    };
                };
                break;
            case ACTION_TYPE.AT_RangedWeapon:
                {
                    var pCSA;
                    var itemIdx = 0;
                    combattargets.RemoveAll();
                    pCSA = combatSummary.PeekAction(actionIndex[0]);
                    itemIdx = pCSA.pMe.PeekWeapon(pCSA.weaponOrd - 1).index;
                    dude = combatSummary.PeekCombatant(pCSA.targetOrd - 1).index;
                    this.m_pCharacter.ReadyWeaponScript(itemIdx);
                    this.m_pCharacter.ReadyBestAmmo(this.m_pCharacter.m_pCombatant.isLargeDude());
                    this.AddTarget(dude, false);
                    this.ReadyBestArmor();
                    this.State(individualCombatantState.ICS_Attacking);
                };
                return true;
            case ACTION_TYPE.AT_Judo:
                {
                    var pCSA;
                    pCSA = combatSummary.PeekAction(actionIndex[0]);
                    combattargets.RemoveAll();
                    dude = combatSummary.PeekCombatant(pCSA.targetOrd - 1).index;
                    this.AddTarget(dude, false);
                    this.ReadyBestArmor();
                    this.State(individualCombatantState.ICS_Attacking);
                };
                return true;
            case AT_MeleeWeapon:
                {
                    var pCSA;
                    pCSA = combatSummary.PeekAction(actionIndex[0]);
                    combattargets.RemoveAll();
                    dude = combatSummary.PeekCombatant(pCSA.targetOrd - 1).index;
                    if (pCSA.weaponOrd == 0) bestWeaponIdx = NO_READY_ITEM;
                    else bestWeaponIdx = pCSA.pMe.PeekWeapon(pCSA.weaponOrd - 1).index;
                    this.m_pCharacter.ReadyWeaponScript(bestWeaponIdx);
                    this.AddTarget(dude, false);
                    this.ReadyBestArmor();
                    this.State(individualCombatantState.ICS_Attacking);
                };
                return TRUE;
            case AT_Unknown:
      /* Really */ Globals.NotImplemented(0xa88, false);
                break;
            default:
      /* Really */ Globals.NotImplemented(0x55ab, false);
                break;
        }
    }


    if (useScriptedAI) {
        var pCSA;
        if (combatSummary.GetActionCount() > 0) {
            combattargets.RemoveAll();
            pCSA = combatSummary.PeekAction(actionIndex[0]);
            dude = combatSummary.PeekCombatant(pCSA.targetOrd - 1).index;
            if (pCSA.weaponOrd == 0) bestWeaponIdx = 0;
            else bestWeaponIdx = pCSA.pMe.PeekWeapon(pCSA.weaponOrd).index;
            this.m_pCharacter.ReadyWeaponScript(bestWeaponIdx);
            this.AddTarget(dude, false);
        };
    };

    if (dude == NO_DUDE) {
        dude = this.GetCurrTarget(true, false, true);
    };
    var tempCOMBATANT = null;
    if (dude != NO_DUDE) {
        tempCOMBATANT = Globals.GetCombatantPtr(dude);
        Globals.ASSERT(tempCOMBATANT != null);
        if (tempCOMBATANT == null) return false;

        //here we must ready the item indicated by combatSunnary
        if (!useScriptedAI || (combatSummary.PeekAction(actionIndex[0]).advance == 0)) {
            if (!this.canAttack(dude, -1, -1, 0, Drawtile.Distance6, useScriptedAI)) {
                // target is not attackable for some reason,
                // so force new target acquisition
                dude = NO_DUDE;
            }
        };
    }

    if ((dude == NO_DUDE)
        || ((tempCOMBATANT != null) && (!tempCOMBATANT.charOnCombatMap(false, true)))) {
        // if no target or it's gone, acquire new target (if any)
        this.RemoveAllTargets();

        var i;
        // try for combat targets with line of sight first
        // combat targets are ordered by distance, but the closest
        // target in terms of distance may be on the other side
        // of a wall. Using line of sight helps to ensure we will attack
        // closest target that is also the shortest path distance.

        for (i = 0; i < Globals.GetNumCombatants(); i++) {
            tempCOMBATANT = Globals.GetCombatantPtr(i);
            Globals.ASSERT(tempCOMBATANT != null);
            if (tempCOMBATANT == null) return false;
            if ((i != this.self)
                && (tempCOMBATANT.GetIsFriendly() != this.GetIsFriendly())
                && (tempCOMBATANT.charOnCombatMap(false, true))) {
                if (Drawtile.HaveLineOfSight(this.GetCenterX(), this.GetCenterY(), tempCOMBATANT.GetCenterX(), tempCOMBATANT.GetCenterY(), null))
                    this.AddTarget(i, false);
            }
        }

        if (this.GetCurrTarget(true, false, true) == NO_DUDE) {
            // no combat targets within line of sight
            // so use any avail target
            for (i = 0; i < Globals.GetNumCombatants(); i++) {
                tempCOMBATANT = Globals.GetCombatantPtr(i);
                Globals.ASSERT(tempCOMBATANT != null);
                if (tempCOMBATANT == null) return false;
                if ((i != this.self)
                    && (tempCOMBATANT.friendly != this.GetIsFriendly())
                    && (tempCOMBATANT.charOnCombatMap(false, true)))
                    this.AddTarget(i, false);
            }
        }
    }

    // might use current target when determining best
    // items to make ready.
    this.ReadyBestArmor();
    // Moved past ReadyBestWeapon 20140425 PRS
    // A monster with a shield refused to use a two-handed weapon at range.
    // So we remove the shield until we decide what weapon will be used.


    // Scripted "THINK" inagurated on 7 May 2014. PRS
    { // *********************************************************** SHIELD
        // ReadyBestShield();
        var pcsc;
        pcsc = combatSummary.PeekCombatant(0);
        if ((pcsc != null) && (pcsc.shieldToReady != 0)) {
            this.m_pCharacter.ReadyShieldScript(pcsc.PeekShield(pcsc.shieldToReady - 1).index);
        }
    }
    if (!useScriptedAI) { // *********************************************************** WEAPON
        this.ReadyBestWpn(this.GetCurrTarget(true, false, true));
    }

    if (!useScriptedAI) {
        dude = this.GetCurrTarget(true, false, true);
    }

    // no combattargets, sit tight and guard
    if (dude == NO_DUDE) {
        this.State(individualCombatantState.ICS_Guarding);
        Globals.TRACE("thinking result for auto combatant " + this.self + " (" + this.CombatantStateText[this.State()] + ") - no targets\n");
        return true;
    }
    var CanAttack = false;
    if (useScriptedAI && (combatSummary.PeekAction(0).advance != 0)) {
        CanAttack = false;
    }
    else {
        CanAttack = this.canAttack(dude, -1, -1, 0, Drawtile.Distance6, useScriptedAI);
    };

    tempCOMBATANT = Globals.GetCombatantPtr(dude);
    Globals.ASSERT(tempCOMBATANT != null);
    if (tempCOMBATANT == null) return false;
    var found = false;

    // no need to find a path if we can attack from current spot
    if (!CanAttack) {
        var repath = true;

        // check to see if existing path to target needs to change
        var pathPtr = pathMgr.GetPath(this.hPath);

        if (pathPtr != null) {
            var stepPtr = pathPtr.GetLastStep();

            if ((tempCOMBATANT.x == stepPtr.x)
                && (tempCOMBATANT.y == stepPtr.y)) {
                // use same path to target
                repath = false;
                found = true;
                Globals.TRACE("Using same path for combatant " + this.self + " to target " + dude + "\n");
            }
            else
                Globals.TRACE("Existing path for combatant " + this.self + " does not end at curr target, re-pathing\n");
        }

        // find path to closest enemy
        // need to change to closest enemy with shortest path!
        if ((repath) && (this.CanMove(false))) {
            this.ClearPath();
            this.SetCurrTarget(); // setup for iteration
            var targetCount = 0;
            dude = this.GetCurrTarget(true, false, true);

            while ((!found)
                && (dude != NO_DUDE)
                && (targetCount < this.GetNumTargets())) {
                tempCOMBATANT = Globals.GetCombatantPtr(dude);
                Globals.ASSERT(tempCOMBATANT != null);
                if (tempCOMBATANT == null) return false;
                if (this.FindPathTo(tempCOMBATANT.x - 1,
                    tempCOMBATANT.y - 1,
                    tempCOMBATANT.x + tempCOMBATANT.width,
                    tempCOMBATANT.y + tempCOMBATANT.height,
                    true,
                    false,
                    false)) {
                    found = true;
                    this.RemoveAllTargets();
                    this.AddTarget(dude, false);
                }
                else {
                    dude = this.GetNextTarget();
                }
                targetCount++;
            }
        }
    }

    if (!found) // do we have a path to take?
    {
        if (!useScriptedAI && (this.GetCurrTarget(true, false, true) == NO_DUDE)) {
            this.State(individualCombatantState.ICS_Guarding);
        }
        else {
            if (CanAttack) {
                this.State(individualCombatantState.ICS_Attacking);
                var itemID;
                var itemIdx;
                itemIdx = this. m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0);
                if (itemIdx != NO_READY_ITEM) {
                    itemID = this.m_pCharacter.myItems.GetItem(itemIdx);
                    var weaponType;
                    weaponType = itemData.GetWpnType(itemID);
                    if ((weaponType == weaponClassType.SpellCaster)
                        || (weaponType == weaponClassType.SpellLikeAbility)) {
                        if (this.m_pCharacter.myItems.GetCharges(itemIdx) > 0) {
                            var pItem;
                            var spellID;
                            pItem = itemData.GetItem(itemID);
                            spellID = pItem.spellID;
                            if (spellID.IsValidSpell()) {
                                var pos;
                                pos = combattargets.GetHeadPosition();
                                if (pos != null) {
                                    var pSpData;
                                    var pTarget;
                                    var rollerLevel = -1;
                                    var newSpell = new CHARACTER_SPELL();
                                    var dir = new PATH_DIR();
                                    pTarget = Globals.GetCombatantPtr(dude);
                                    combattargets.RemoveAll();
                                    pSpData = spellData.GetSpell(spellID);
                                    {
                                        var result = "";
                                        var hookParameters = new HOOK_PARAMETERS();
                                        var scriptContext = new SCRIPT_CONTEXT();
                                        scriptContext.SetSpellContext(pSpData);
                                        scriptContext.SetAttackerContext(this);
                                        result = pSpData.RunSpellScripts(
                                            SPECAB.SPELL_CASTER_LEVEL,
                                            SPECAB.ScriptCallback_RunAllScripts,
                                            null,
                                            "Combat AI - Can combatant use this spell");
                                        if (result.GetLength() > 0) {
                                            rollerLevel = parseInt(result);
                                            if (isNaN(rollerLevel)) { rollerLevel = -1; }  // PORT NOTE:  Reset to its initialized value if parseInt fails
                                        };
                                    };

                                    var targs = this.EvalDiceAsClass(pSpData.TargetQuantity(),
                                        pSpData.schoolID,
                                        pSpData.Level, 
                                       rollerLevel);
                                    var range = this.EvalDiceAsClass(pSpData.TargetRange(),
                                        pSpData.schoolID,
                                        pSpData.Level, 
                                        rollerLevel);
                                    var xSize = this.EvalDiceAsClass(pSpData.TargetWidth(),
                                        pSpData.schoolID,
                                        pSpData.Level, 
                                        rollerLevel);
                                    var ySize = this.EvalDiceAsClass(pSpData.TargetHeight(),
                                        pSpData.schoolID,
                                        pSpData.Level, 
                                        rollerLevel);
                                    this.m_pCharacter.InitTargeting(pSpData.Targeting,
                                        pSpData.CanTargetFriend,
                                        pSpData.CanTargetEnemy,
                                        FALSE,
                                        targs,
                                        range,
                                        xSize,
                                        ySize,
                                        pSpData.Lingers);
                                    this.m_itemSpellIDBeingCast = spellID;
                                    this.Wpn_Type = pItem.Wpn_Type;
                                    this.combatant_spellCastingLevel = rollerLevel;
                                    this.m_spellIDBeingCast.Clear();
                                    dir = PATH_DIR.GetSpellTargetingDir(this.GetCenterX(), this.GetCenterY(), pTarget.x, pTarget.y);
                                    if (m_pCharacter.targets.m_SelectingUnits) {
                                        this.C_AddTarget(pTarget, range);
                                    }
                                    else {
                                        var dirX = 0, dirY = 0;
                                        dirX = pTarget.x - this.GetCenterX();
                                        dirY = pTarget.y - this.GetCenterY();
                                        this.AddMapTarget(pTarget.x, pTarget.y, dir, dirX, dirY);
                                    };
                                    this.State(individualCombatantState.ICS_Casting);
                                    this.m_pCharacter.ClearSpellbook();
                                    this.m_pCharacter.UseSpellLimits(false);
                                    //m_pCharacter->KnowSpell(MagicUserFlag,MagicUserFlag,gsID,1,TRUE);
                                    //Not Implemented(0x7c5da86, false);
                                    // We may have to do some fiddling here.
                                    // Setting the caster baseclass and spell school to
                                    // illegal values for now......
                                    {
                                        var schoolID;
                                        var baseclassID;
                                        this.m_pCharacter.KnowSpell(baseclassID, schoolID, spellID, 1, true);
                                    }
                                    this.m_pCharacter.myItems.SetCharges(itemIdx, this.m_pCharacter.myItems.GetCharges(itemIdx) - 1);
                                    if (this.m_pCharacter.myItems.GetCharges(itemIdx) <= 0) {
                                        this.m_pCharacter.myItems.DeleteItem(itemIdx);
                                    }
                                }
                            }
                        }
                        else {
                            this.m_pCharacter.myItems.DeleteItem(itemIdx);
                            this.State(individualCombatantState.ICS_Guarding);
                        }
                    }
                }
            }
            else
                this.State(individualCombatantState.ICS_Guarding);
        }
    }
    else
        this.State(individualCombatantState.ICS_Moving);

    Globals.TRACE("thinking result for auto combatant " + this.self + " (" + this.CombatantStateText[this.State()] + ")\n");
    return true;
}


// Returns non-zero if scrren needs to be redrawn
COMBATANT.prototype.HandleCurrState = function(zeroMoveAttackOK) {
    var dude;
    var updateScreen = 0;
    switch (this.State()) {
        case individualCombatantState.ICS_None:
            break;
        case individualCombatantState.ICS_Fled:
            this.EndTurn();
            break;
        case individualCombatantState.ICS_Casting:
            break;
        case individualCombatantState.ICS_Using:
            break;
        case individualCombatantState.ICS_Guarding:
            break;
        case individualCombatantState.ICS_Bandaging:
            break;
        case individualCombatantState.ICS_Turning:
            break;
        case individualCombatantState.ICS_Attacking:
            dude = this.GetCurrTarget(true, false, true);
            if (dude == NO_DUDE)
                this.EndTurn();
            else {
                if (!this.canAttack(dude, -1, -1, 0, Drawtile.Distance6, false))
                    this.EndTurn();
            }
            break;

        case individualCombatantState.ICS_Moving:
            if (this.hPath < 0) {
                // if actually have a destination
                if ((this.moveX >= 0) && (this.moveY >= 0) && coordsOnMap(this.moveX, this.moveY, this.width, this.height)) {
                    // find path to moveX, moveY
                    this.FindPathTo(this.moveX, this.moveY, this.moveX, this.moveY, !zeroMoveAttackOK, true, true);
                }
                else {
                    // This guy is fleeing the map. Paths of length 1 result
                    // in instant flee. Longer paths need to move dude to
                    // edge of map before flee is performed.
                    this.iFleeingFlags |= FLEEING_FLAGS.fleeBecauseOffMap;

                    if (this.friendly)
                        this.IncNumFriendFlee(); //combatData.numFrndFlee++;
                    else
                        this.IncNumMonsterFlee(); //combatData.numMonFlee++;

                    RunEvent.menu.setMenu(MENU_DATA_TYPE.EmptyMenuData, null, true, null, null); // starts empty
                    RunEvent.menu.setHorzOrient();
                    RunEvent.menu.setUseActive(false); // no highlighting      

                    var msg = "";
                    msg = this.GetName() + " has fled...";
                    RunEvent.menu.changeMenuItem(1, msg);
                    Screen.UpdateCombatTimeDelayMsg();
                    theApp.AppSleep(Globals.GetMsgTimeDelay()); // give time to see flee message      

                    //BUGFIX EndTurn();
                    this.SetStatus(charStatusType.Fled);
                    this.State(individualCombatantState.ICS_Fled); //BUGFIX
                    Drawtile.placeCombatant(this.x, this.y, NO_DUDE, this.width, this.height); Globals.TRACE(this.self + " has fled the map\n");
                }
            }

            if (this.hPath >= 0) {
                if (!this.TakeNextStep(true)) {
                    // unable to move/attack target
                    if ((this.OnAuto(false)) && (this.State() == individualCombatantState.ICS_Moving)) {
                        // end your turn but continue
                        // guarding if possible          
                        if (this.CanGuard(GUARDING_CASE.GUARD_AutoMaxMovement)) {
                            Globals.TRACE("Auto combatant " + this.self + " can't move, ending turn and guarding\n");
                            this.EndTurn(ICS_Guarding);
                        }
                        else {
                            Globals.TRACE("Auto combatant " + this.self + " can't move, ending turn\n");
                            this.EndTurn();
                        }
                    }
                }
                else {
                    updateScreen = 1;
                };
            }

            this.moveX = -1; this.moveY = -1;
            if (this.State() != individualCombatantState.ICS_Moving)
                this.ClearPath();
            break;

        default:
            Globals.die(0xab4c4);
            break;
    }
    return updateScreen;
}



var kernelError = false;
COMBATANT.prototype.LoadAI_Script = function () {

    return false;  /**TODO - leaving out the AI Script for now **/
    if (!kernelError) {
        if (Forth.ExpandKernel()) {
            Forth.FetchKernel(thinkProgram.pgm);
        }
        else {
            kernelError = true;
            debugSeverity = 5;
            WriteDebugString("***Error in combat THINKING script***\n");
        };
    };
    return !kernelError;
}



COMBATANT.prototype.GetCurrTarget = function (updateTarget, unconsciousOK, petrifiedOK) {
    //8a2a
    if (this.m_target != NO_DUDE) {
        var targCOMBATANT;
        targCOMBATANT = Globals.GetCombatantPtr(this.m_target);

        if (targCOMBATANT == null) return NO_DUDE;
        if (!targCOMBATANT.charOnCombatMap(unconsciousOK, petrifiedOK)) {
            if (!updateTarget) return this.m_target;
            this.RemoveCurrTarget();
            if (this.m_target == NO_DUDE) return m_target;
            targCOMBATANT = Globals.GetCombatantPtr(m_target);
        };
        if (!combatData.IsValidTarget(this, targCOMBATANT, this.targetValidity)) return NO_DUDE;
    };

    return this.m_target;
}

COMBATANT.prototype.HandleTimeDelayMsgBegin = function(extraAttacksAvailable, pDeathIndex) {
    switch (this.State()) {
    /*#ifdef D20140707     //PORT NOTE:  Not sure but it was greyed out in Visual Studio so I left it out
      case ICS_Guarding:
        if (extraAttacksAvailable > 0) {
            return makeAttack(GetCurrTarget(true, false),
                extraAttacksAvailable,
                pDeathIndex);
        };
        break;
    #endif*/
    case individualCombatantState.ICS_Attacking:
        return this.makeAttack(this.GetCurrTarget(true, false, true),
            extraAttacksAvailable,
            pDeathIndex);

      default:
        break;
    }
    return -1;
}


COMBATANT.prototype.CanMove = function(allowZeroMove) {
    if (this.GetType() == MONSTER_TYPE) {
        if (Globals.GetConfigMonsterNoMove())
            return false;
    }

    if (this.IsDone(false, "Can combatant move"))
        return false;

    if (allowZeroMove) {
        return true;
    };
    if (this.m_iMovement >= this.GetAdjMaxMovement(DEFAULT_SPELL_EFFECT_FLAGS, "Can combatant move")) {
        return false;
    };
    return true;
}

COMBATANT.prototype.ClearPath = function() {
    if (this.hPath >= 0)
        pathMgr.FreePath(this.hPath);
    this.hPath = -1;
}

COMBATANT.prototype.GetNumTargets = function () {
    return this.combattargets.GetCount();
}

// RETURNS: FALSE if already there
COMBATANT.prototype.FindPathTo = function(destLeft, destTop, destRight, destBottom, CheckOccupants, allowZeroMove, moveOriginPoint) {
    if (!this.OnAuto(false)) {
        if ((Math.abs(destLeft - x) > 1) || (Math.abs(destTop - y) > 1))
            Globals.TRACE("Moving more than 1 square\n");
    }

    this.ClearPath();

    if (!this.CanMove(allowZeroMove)) return false;

    pathMgr.SetPathSize(this.width, this.height);
    this.hPath = pathMgr.GetPath9(this.x, this.y, destLeft, destTop, destRight, destBottom, CheckOccupants, this, moveOriginPoint);
    return (this.hPath >= 0);
}

COMBATANT.prototype.GetNextTarget = function() {
    var dude = NO_DUDE;

    if (this.combattargets.IsEmpty())
        return NO_DUDE;

    if (this.targetPos == null) {
        this.targetPos = this.combattargets.GetHeadPosition();
    }
    else {
        this.combattargets.GetNext(this.targetPos); this.targetPos = this.combattargets.NextPos(this.targetPos);    // PORT NOTE:  Manually advancing pointer becaues no pass-by-reference parameters
        if (this.targetPos == null)
            this.targetPos = this.combattargets.GetHeadPosition();
    }

    dude = this.combattargets.PeekAtPos(this.targetPos);
    return dude;
}

COMBATANT.prototype.TakeNextStep = function(allowZeroMoveAttack) {
    var isUpdate = false;
    var pathPtr = pathMgr.GetPath(this.hPath);

    if (pathPtr != null) {
        var stepPtr = pathPtr.GetNextStep();

        if (stepPtr.x >= 0) {
            Globals.TRACE(this.self + " taking next step of path " + this.hPath + " to " + stepPtr.x + "," + stepPtr.y + "\n");
            isUpdate = this.MoveCombatant(stepPtr.x, stepPtr.y, allowZeroMoveAttack);
        }
        else {
            Globals.WriteDebugString("Bogus step data for path " + this.hPath + " in TakeNextStep()\n");
            this.ClearPath();
        }

        if ((pathPtr.GetStepCount() <= 0) || (!isUpdate))
            this.ClearPath();
    }
    else {
        Globals.WriteDebugString("Bogus hPath " + this.hPath + " in TakeNextStep()\n");
        this.ClearPath();
    }

    return isUpdate;
}

COMBATANT.prototype.OnEndTurn = function() {
    Globals.TRACE("OnEndTurn for " + this.self + "\n");
}