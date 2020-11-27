﻿using System;
using System.Collections;
using System.Collections.Generic;
using Jint.Runtime;
using UAFLib;
using UnityEngine;

public static class GameState
{
    public const int MAX_MONSTERS = 100;

    public static Jint.Engine engine;
    public static ConsoleResults engineOutput = new ConsoleResults();
    public static Dictionary<int, String> monsters = new Dictionary<int, string>();
    public static int monsterMoveIdx = 0;
    public static bool allowInput = true;
    public static List<int> deadMonsters = new List<int>();
    public static BitArray blockedSquares;                      // This tracks which map tiles cannot be walked on my player or monsters - tiles are listed in a single "array" of all rows/columns
    public static int mapDataWidth, mapDataHeight;
    public static bool soundOn = false;
    public static UnityUAFEventManager eventManager = new UnityUAFEventManager();
    public static GameObject activeItemCollider = null;         // This will track what item the user is currently "on top" of on the map

    public static void engineExecute(string expression)
    {
        try
        {
            engine.Execute(expression);
        }
        catch (Exception ex)
        {
            Debug.Log("Jint Exception.  Line: " + ex);
        }
    }
}
