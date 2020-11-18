﻿using System.Collections;
using System.Collections.Generic;
using UAFLib;
using UnityEngine;
using UnityEngine.UI;

public class InventorySceneEvents : MonoBehaviour
{
    Jint.Engine engine;
    ConsoleResults engineOutput;
    Dictionary<int, string> monsters;

    bool painted = false;
    // Start is called before the first frame update
    void Start()
    {
        DontDestroyOnLoad(this.gameObject);
        this.engine = GameState.engine;
        this.engineOutput = GameState.engineOutput;
        this.monsters = GameState.monsters;

    }

    // Update is called once per frame
    void Update()
    {
        if (!painted)
        {
            paintInventory();
            painted = true;
        }

        if (Input.GetKeyDown(KeyCode.X))
            BackToCombat();

    }

    public void paintInventory()
    {
        Text txtInventoryList = GameObject.Find("txtInventoryList").GetComponent<Text>();
        engine.Execute("consoleResults.payload = makeInventoryList(cWarrior);");
        txtInventoryList.text = engineOutput.payload.ToString();
    }

    public void BackToCombat()
    {
        UnityEngine.SceneManagement.SceneManager.LoadScene("CombatScene");
        GameState.engine = this.engine;
        GameState.engineOutput = this.engineOutput;
        GameState.monsters = this.monsters;
    }
}