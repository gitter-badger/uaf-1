﻿function BASE_CLASS_DATA() {
    this.m_preSpellNameKey = 0;
    this.m_name = "";

    this.m_abilityReq = [];  //  of ABILITY_REQ
    this.m_allowedRaces = [];    // of RACE_ID
    this.m_expLevels = [];  // of DWORD
    this.m_castingInfo = [];    // of CASTING_INFO
    this.THAC0 = []; for (idx = 0; idx < HIGHEST_CHARACTER_LEVEL; idx++) { this.THAC0[idx] = 0; }   // of char

    this.m_allowedAlignments = 0; // Bitmap of 1 << alignmentType
    this.m_specAbs = new SPECIAL_ABILITIES();
    //this.hitDice = []; for (idx = 0; idx < HIGHEST_CHARACTER_LEVEL; idx++) { this.hitDice[idx] = new DICEDATA(); };
 
    this.m_skills = [];    // SKILL
    this.m_skillAdjustmentsAbility = [];   // of SKILL_ADJUSTMENT_ABILITY
    this.m_skillAdjustmentsBaseclass = [];  // of SKILL_ADJUSTMENT_BASECLASS
    this.m_skillAdjustmentsRace = [];   // of SKILL_ADJUSTMENT_RACE
    this.m_skillAdjustmentsScript = [];  // of SKILL_ADJUSTMENT_SCRIPT
    this.m_bonusXP = [];   // of BONUS_XP

    this.m_spellBonusAbility = "";  // Strength, etc.
    this.m_bonusSpells = []; //Byte triples prime,level,quantity
                                         // Cumulative!  At prime level 3 he gets the
                                         // bonus for levels 1, 2, and 3.

    /**TODO**
    ABILITYLIMITS BASE_CLASS_DATA:: GetAbilityReqs(ABILITY_ID abilityID) const ;
     CString RunBaseClassScripts(LPCSTR     scriptName,
        CBRESULT(* fnc)(CBFUNC func, CString * scriptResult, void * pkt),
        void      * pkt,
        LPCSTR     comment) const
            {
                return m_specAbs.RunScripts(scriptName,
                    fnc,
                    pkt,
                    comment,
                    ScriptSourceType_Baseclass,
                    m_name);
      };

 
    void GetHitDice(int level, int * sides, int * numDice, int * constant) const ;
    void DetermineCharHitDice(int * totalDice, int * maxDice, int level) const ;

    void UpdateSkillValue(SKILL_COMPUTATION & SC) const ;
    BASE_CLASS_DATA(void);
    ~BASE_CLASS_DATA(void);
    BASE_CLASS_DATA & operator =(const BASE_CLASS_DATA& src);
    BOOL operator == (const BASE_CLASS_DATA& src) const ;
    void Clear(void);
    int GetDataSize(void) const ;
    BASECLASS_ID BaseclassID(void) const { BASECLASS_ID bci; bci = m_name; return bci;};
    void PreSerialize(BOOL IsStoring);
    int Serialize(CAR & car);
    void PostSerialize(BOOL IsStoring);
    void AddAbilityRequirement(ABILITY_REQ & abReq);
    void AddAllowedRace(const RACE_ID& raceID);
    void AddExpLevel(DWORD exp);
    void SetUAAbilityLimits(int baseclassArrayIndex);
    void SetUAAllowedAlignments(int baseclassArrayIndex);
    ABILITYLIMITS GetAbilityLimits(abilityType abType) const ;
    bool IsAllowedRace(const RACE_ID& raceID) const ;
    int  GetMaxLevel(void) const ;
    int  GetMaxExpForLevel(int level) const ;
    int  GetMinExpForLevel(int level) const ;
    int  GetLevel(DWORD exp) const ;

    //void ComputeCharSavingThrow(const CString& versus, int *result, int level) const;
    void GetSkillValue(SKILL_COMPUTATION & SC) const ;
    */
}