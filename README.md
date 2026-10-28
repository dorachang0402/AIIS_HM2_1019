# Kaggle Bike Sharing Demand 共享單車需求預測系統
> **遵循 CRISP-DM 跨產業數據探勘標準流程之機器學習分析與互動式決策平台**

---

🔗 **線上互動網站 (Live Demo)：** https://dorachang0402.github.io/AIIS_HM2_1019/

---

## 📸 網站截圖

![BikeFlow AI 互動式分析平台網站畫面](./website_screenshot.png)

---

## 📌 專案簡介

本專案以 **Kaggle Bike Sharing Demand** 共享單車資料集為基礎，遵循 **CRISP-DM** 資料探勘標準流程，分析時間、氣候及使用者行為等因素對共享單車租借需求的影響，並透過機器學習模型預測每小時租借量，協助營運單位進行車輛調度與資源配置。

---

## ✨ 主要功能

- **商業理解（Business Understanding）**：分析車輛調度、動態激勵及預防性維護等營運需求。
- **資料理解（Data Understanding）**：透過探索性資料分析（EDA），觀察租借量、時間、天候及使用者類型的關聯。
- **資料準備（Data Preparation）**：進行時間特徵工程、目標變數對數轉換及訓練集與測試集切分。
- **模型建立（Modeling）**：比較線性迴歸、Ridge 嶺迴歸及隨機森林等模型，評估不同特徵組合的預測表現。
- **模型評估（Evaluation）**：利用 RMSE、R²、MAE、實際值與預測值比較及殘差分析，檢視模型表現。
- **互動式預測（Deployment）**：調整時間、氣溫、濕度、風速及天候等參數，即時模擬租借需求，並提供營運調度建議與預測結果匯出功能。

---

## 🛠️ 使用技術

| 項目 | 內容 |
| :--- | :--- |
| **程式語言** | `Python`、`JavaScript` |
| **資料處理** | `Pandas`、`NumPy` |
| **機器學習** | `Scikit-learn` |
| **資料視覺化** | 互動式圖表 |
| **資料來源** | [Kaggle Bike Sharing Demand](https://www.kaggle.com/c/bike-sharing-demand) |
| **部署平台** | GitHub Pages |

---

## 📊 專案特色

- 以 **CRISP-DM 六階段**完整呈現資料探勘流程。
- 分析時間、氣候與使用者行為對共享單車需求的影響。
- 比較不同特徵組合與機器學習模型的預測表現。
- 提供可互動的需求預測介面，將分析結果轉化為實際營運決策參考。

---

## 🎓 專案資訊

- **專案類型**：人工智慧與資料探勘課程專題
- **分析主題**：共享單車租借需求預測
- **研究方法**：CRISP-DM、探索性資料分析、特徵工程、機器學習模型評估

---

<p align="center">
  <sub>© 2026 AIIS Lab. All rights reserved.</sub>
</p>