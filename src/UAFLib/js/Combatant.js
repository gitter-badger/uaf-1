/** TODO **/
function COMBATANT() {
    if (this.m_pCharacter != null) {
        Globals.die(0xffd21c);
    };
    this.combatantSA = new SPECIAL_ABILITIES();
    this.combatantSA.Clear();
    this.combattargets = new CList();
    this.Clear();
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
};

COMBATANT.prototype.State = function (ICS) {
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
    RunCombatantScripts(SPECAB.GUARDING_GUARD,
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
        pTarget = this.GetCombatantPtr(targ);

        if (!pTarget.charOnCombatMap(false, true)) {
            return false;
        };
    };
    this.State(ICS_Attacking);
    this.StopCasting(false, false);
    this.EnsureVisibleTarget(targ);
    this.continueAttack = true;
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

    Globals.ASSERT(this.GetAdjHitPoints() > 0);

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
        targCOMBATANT = this.GetCombatantPtr(targ);
        Globals.ASSERT(targCOMBATANT != null);
        if (targCOMBATANT != null) {
            isLargeTarget = targCOMBATANT.isLargeDude();
            dist = Distance(self, x, y,
                targCOMBATANT.self, targCOMBATANT.x, targCOMBATANT.y);
        }
    }
    this.m_pCharacter.ReadyBestWpn(dist, isLargeTarget);

    // if target is distant but don't have distance weapon
    // then ready hand-to-hand weapon
    if ((dist > 1) && (this.m_pCharacter.myItems.GetReadiedItem(Items.WeaponHand, 0) == Items.NO_READY_ITEM))
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

COMBATANT.prototype.SetMorale = function (val) {
    return this.m_pCharacter.SetMorale(val);
}