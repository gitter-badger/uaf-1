function COMBAT_EVENT_DATA() {
    GameEvent.call(this);
    Object.setPrototypeOf(this, GameEvent.prototype);

    this.m_UseOutdoorMap = false; // set at run-time as event activates
    this.distance = 0;
    this.direction = 0;
    this.m_eSurprise = 0;
    this.m_eTEMPsurprise = 0;
    this.autoApproach = false;
    this.outdoors = false;
    this.noMonsterTreasure = false;
    this.partyNeverDies = false;
    this.partyNoExperience = false;
    this.noMagic = false;
    this.randomMonster = false;
    this.DeathSound = "";
    this.MoveSound = "";
    this.TurnUndeadSound = "";
    this.monsterMorale = 0;
    this.turningMod = 0;
    this.monsters = null;  //MONSTER_EVENT_DATA
    this.bgSounds = null;  //BACKGROUND_SOUND_DATA
    this.needDeathSprite = false;
    this.needDyingSprite = false;

    this.Clear();
    this.event = eventType.Combat;
}

COMBAT_EVENT_DATA.prototype.Clear = function ()
{
    super.Clear();

    this.m_stoppedSounds = false;
    this.m_UseOutdoorMap = false;
    this.distance = eventDistType.FarAway; eventDirType.direction = Any; this.m_eSurprise = eventSurpriseType.Neither;
    this.autoApproach = false; this.outdoors = false; this.noMonsterTreasure = false;
    this.partyNeverDies = false; this.noMagic = false; this.monsterMorale = 50;
    this.partyNoExperience = false;
    this.randomMonster = false;
    this.turningMod = eventTurnUndeadModType.None;
    this.monsters.Clear();
    this.DeathSound = "";
    this.MoveSound = "";
    this.TurnUndeadSound = "";
    this.bgSounds.Clear(); this.m_eTEMPsurprise = eventSurpriseType.Neither;
}