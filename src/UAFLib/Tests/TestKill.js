// I should have killed something after 50 attacks
for (var idxAttack = 0; idxAttack < 50; idxAttack++)
    cWarrior.makeAttack(idxEnemy, 0, deathIndex);

Globals.debug("dyingCount:" + UIEventManager.dyingCount);
Globals.ASSERT(UIEventManager.dyingCount == 1);