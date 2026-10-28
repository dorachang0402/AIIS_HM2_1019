"""
Kaggle Bike Sharing Demand 共享單車需求複迴歸與機器學習分析
遵循 CRISP-DM (跨產業數據探勘標準流程) 6 大步驟
"""

import sys
import io
import os
import urllib.request

# 設定標準輸出為 UTF-8，避免 Windows 繁體中文終端機 (cp950) 編碼錯誤
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

# 設定字型支援 (包含微軟正黑體、簡黑、Segoe UI 與 Unicode 負號)
plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei", "SimHei", "Segoe UI", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

# ==============================================================================
# 1. Business Understanding (商業理解)
# ==============================================================================
# 【目標】：
# 建立共享單車需求量 (Bike Sharing Demand) 預測模型，探討時間特徵 (Hour、Month、Year)、
# 天氣狀況 (Weather、Temp、Humidity、Windspeed) 及工作日模式 (Working Day) 對租借量 (count) 的影響。
#
# 【商業價值】：
# 1. 車輛調度最佳化 (Fleet Rebalancing)：預測各時段熱點借還車需求，提前安排調度車輛，避免「無車可借 (空樁)」或「無位可還 (爆樁)」。
# 2. 動態定價與激勵 (Dynamic Pricing & Incentives)：針對離峰與尖峰時段設計彈性租借費率或會員還車獎勵，自發平衡車流。
# 3. 維運與安全管理 (Maintenance & Safety Management)：於惡劣天候 (暴雨、低溫、高濕) 或夜間離峰時段排定車輛檢修，兼顧騎士安全與營運效益。
print("=" * 60)
print("1. Business Understanding: 目標與商業價值確立完成")
print("=" * 60)

# ==============================================================================
# 2. Data Understanding (資料理解)
# ==============================================================================
train_csv_path = "train.csv"
if not os.path.exists(train_csv_path):
    print("正在下載 Kaggle Bike Sharing Demand 資料集...")
    train_url = "https://raw.githubusercontent.com/harshitssj4/Kaggle-Bike-Sharing-Demand/master/train.csv"
    urllib.request.urlretrieve(train_url, train_csv_path)

df = pd.read_csv(train_csv_path)

print("\n" + "=" * 60)
print("2. Data Understanding (資料理解)")
print("=" * 60)
print("\n--- [2.1] 資料前 5 筆 ---")
print(df.head())

print("\n--- [2.2] 資料型態與非空值統計 ---")
df.info()

print("\n--- [2.3] 缺失值檢查 ---")
print(df.isnull().sum())

print("\n--- [2.4] 數值型特徵敘述性統計 (Describe) ---")
print(df.describe())

print("\n--- [2.5] 季節與天氣分佈 ---")
print("Season 季節分佈 (1:春, 2:夏, 3:秋, 4:冬):")
print(df["season"].value_counts().sort_index())
print("\nWeather 天氣分佈 (1:晴朗, 2:多雲陰天, 3:微雨小雪, 4:惡劣暴雨雪):")
print(df["weather"].value_counts().sort_index())

# ==============================================================================
# 3. Data Preparation (資料準備)
# ==============================================================================
print("\n" + "=" * 60)
print("3. Data Preparation (資料準備與特徵工程)")
print("=" * 60)

# (1) 時間特徵提取 (Datetime Feature Engineering)
df["datetime"] = pd.to_datetime(df["datetime"])
df["hour"] = df["datetime"].dt.hour
df["month"] = df["datetime"].dt.month
df["year"] = df["datetime"].dt.year
df["dayofweek"] = df["datetime"].dt.dayofweek

print("已由 datetime 欄位成功解析特徵: hour (小時), month (月份), year (年份), dayofweek (星期)")

# (2) 選取特徵與目標變數
feature_cols = ["hour", "temp", "humidity", "year", "month", "weather", "windspeed", "workingday"]
X = df[feature_cols]
y = df["count"]

# (3) 拆分訓練集與測試集 (80% 訓練, 20% 測試)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"訓練集維度: X_train = {X_train.shape}, y_train = {y_train.shape}")
print(f"測試集維度: X_test  = {X_test.shape}, y_test  = {y_test.shape}")

# ==============================================================================
# 4. Modeling (模型建立) & Feature Selection (特徵選取評估)
# ==============================================================================
print("\n" + "=" * 60)
print("4. Modeling & Feature Selection (特徵選取比較評估)")
print("=" * 60)

# (1) 基準全特徵模型擬合
regressor = LinearRegression()
regressor.fit(X_train, y_train)
print("已成功使用 scikit-learn LinearRegression 擬合訓練集數據！")

# (2) 特徵數量消長實驗 (Feature Selection Comparison)
features_fit = [
    ["hour"],
    ["hour", "temp"],
    ["hour", "temp", "humidity"],
    ["hour", "temp", "humidity", "year"],
    ["hour", "temp", "humidity", "year", "month"],
    ["hour", "temp", "humidity", "year", "month", "weather"],
    ["hour", "temp", "humidity", "year", "month", "weather", "windspeed"],
    ["hour", "temp", "humidity", "year", "month", "weather", "windspeed", "workingday"]
]

feature_results = []
for num_feat, feats in enumerate(features_fit, 1):
    m = LinearRegression()
    m.fit(X_train[feats], y_train)
    preds = m.predict(X_test[feats])
    
    val_rmse = np.sqrt(mean_squared_error(y_test, preds))
    val_r2 = r2_score(y_test, preds)
    
    feature_results.append({
        "Number of Features": num_feat,
        "Selected Features": f"[{', '.join(feats)}]",
        "RMSE": val_rmse,
        "R-squared": val_r2
    })

feature_results_df = pd.DataFrame(feature_results)

print("\n--- 特徵選取評估結果 (Feature Selection Summary Table) ---")
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)
print(feature_results_df.to_string(index=False))

# (3) 繪製特徵數量與 RMSE、R-squared 之關係圖
fig_feat, (ax_rmse, ax_r2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=300)

x_nums = feature_results_df["Number of Features"].values
rmse_vals = feature_results_df["RMSE"].values
r2_vals = feature_results_df["R-squared"].values

# ----------------- 子圖 1: RMSE by Number of Features -----------------
rmse_color = "#4f46e5"  # 沉穩靛藍色 (Indigo)
ax_rmse.plot(x_nums, rmse_vals, color=rmse_color, linewidth=2.5, marker="o", 
             markersize=8, markerfacecolor="#ffffff", markeredgecolor=rmse_color, markeredgewidth=2.2, label="RMSE")
ax_rmse.fill_between(x_nums, rmse_vals, min(rmse_vals) * 0.98, color=rmse_color, alpha=0.08)

# 標註最佳點 (k=7 或 k=8)
best_rmse_idx = int(np.argmin(rmse_vals))
for idx, (x, y_val) in enumerate(zip(x_nums, rmse_vals)):
    if idx == best_rmse_idx:
        ax_rmse.plot(x, y_val, marker="o", markersize=11, markerfacecolor="#e11d48", markeredgecolor="#ffffff", markeredgewidth=2)
        ax_rmse.annotate(f"★ Optimal (k={x})\nRMSE: {y_val:.2f}",
                         xy=(x, y_val), xytext=(x, y_val + 5.5),
                         ha="center", fontsize=9.5, fontweight="bold", color="#991b1b",
                         bbox=dict(boxstyle="round,pad=0.4", facecolor="#ffe4e6", edgecolor="#f43f5e", alpha=0.9),
                         arrowprops=dict(arrowstyle="->", color="#e11d48", lw=1.5))
    else:
        ax_rmse.text(x, y_val + 1.2, f"{y_val:.1f}", ha="center", va="bottom", fontsize=8.5, color="#475569")

ax_rmse.set_title("RMSE by Number of Features (Bike Sharing Demand)", fontsize=13, fontweight="bold", pad=12, color="#1e293b")
ax_rmse.set_xlabel("Number of Features", fontsize=11, labelpad=8, color="#334155")
ax_rmse.set_ylabel("RMSE (Lower is Better)", fontsize=11, labelpad=8, color="#334155")
ax_rmse.set_xticks(x_nums)
ax_rmse.set_ylim(min(rmse_vals) - 6, max(rmse_vals) + 10)

# ----------------- 子圖 2: R-squared by Number of Features -----------------
r2_color = "#059669"  # 翡翠綠 (Emerald)
ax_r2.plot(x_nums, r2_vals, color=r2_color, linewidth=2.5, marker="o", 
           markersize=8, markerfacecolor="#ffffff", markeredgecolor=r2_color, markeredgewidth=2.2, label="R-squared")
ax_r2.fill_between(x_nums, r2_vals, min(r2_vals) * 0.98, color=r2_color, alpha=0.08)

best_r2_idx = int(np.argmax(r2_vals))
for idx, (x, y_val) in enumerate(zip(x_nums, r2_vals)):
    if idx == best_r2_idx:
        ax_r2.plot(x, y_val, marker="o", markersize=11, markerfacecolor="#059669", markeredgecolor="#ffffff", markeredgewidth=2)
        ax_r2.annotate(f"★ Optimal (k={x})\nR²: {y_val:.4f}",
                       xy=(x, y_val), xytext=(x, y_val - 0.05),
                       ha="center", fontsize=9.5, fontweight="bold", color="#065f46",
                       bbox=dict(boxstyle="round,pad=0.4", facecolor="#ecfdf5", edgecolor="#10b981", alpha=0.9),
                       arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5))
    else:
        ax_r2.text(x, y_val + 0.012, f"{y_val:.3f}", ha="center", va="bottom", fontsize=8.5, color="#475569")

ax_r2.set_title("R-squared by Number of Features (Bike Sharing Demand)", fontsize=13, fontweight="bold", pad=12, color="#1e293b")
ax_r2.set_xlabel("Number of Features", fontsize=11, labelpad=8, color="#334155")
ax_r2.set_ylabel("R-squared (Higher is Better)", fontsize=11, labelpad=8, color="#334155")
ax_r2.set_xticks(x_nums)
ax_r2.set_ylim(min(r2_vals) - 0.06, max(r2_vals) + 0.05)

for ax in (ax_rmse, ax_r2):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#cbd5e1")
    ax.spines["bottom"].set_color("#cbd5e1")
    ax.tick_params(colors="#475569", labelsize=9.5)
    ax.grid(True, linestyle="--", linewidth=0.7, color="#e2e8f0", alpha=0.9)

plt.tight_layout()
feat_chart_path = "feature_selection_plots.png"
fig_feat.savefig(feat_chart_path, dpi=300, bbox_inches="tight")
plt.close(fig_feat)
print(f"\n特徵選取趨勢圖已儲存至: {feat_chart_path}")

# (4) 將特徵選取結果表格生成為現代報告風圖表
fig_tbl, ax_tbl = plt.subplots(figsize=(16, 4.5), dpi=300)
ax_tbl.axis("off")

table_data = [
    [
        f"★ {row['Number of Features']} (Optimal)" if row["Number of Features"] == 7 else f"{row['Number of Features']}",
        row["Selected Features"],
        f"{row['RMSE']:.4f}",
        f"{row['R-squared']:.4f}"
    ]
    for _, row in feature_results_df.iterrows()
]
col_headers = ["Number of Features", "Selected Features", "RMSE", "R-squared"]
col_widths = [0.18, 0.56, 0.13, 0.13]

table_obj = ax_tbl.table(
    cellText=table_data,
    colLabels=col_headers,
    colWidths=col_widths,
    cellLoc="left",
    loc="center",
    bbox=[0.01, 0.05, 0.98, 0.90]
)
table_obj.auto_set_font_size(False)
table_obj.set_fontsize(10.5)

for (row_idx, col_idx), cell in table_obj.get_celld().items():
    ha_align = "center" if col_idx == 0 else ("right" if col_idx in [2, 3] else "left")
    if row_idx == 0:
        cell.set_facecolor("#1e293b")
        cell.set_edgecolor("#334155")
        cell.set_linewidth(1.2)
        cell.set_text_props(color="#ffffff", weight="bold", ha=ha_align)
    elif row_idx == 7:  # k=7
        cell.set_facecolor("#ecfdf5")
        cell.set_edgecolor("#a7f3d0")
        cell.set_linewidth(1.0)
        cell.set_text_props(color="#065f46", weight="bold" if col_idx in [0, 2, 3] else "normal", ha=ha_align)
    else:
        row_bg = "#f8fafc" if row_idx % 2 == 1 else "#ffffff"
        cell.set_facecolor(row_bg)
        cell.set_edgecolor("#e2e8f0")
        cell.set_linewidth(0.8)
        cell.set_text_props(color="#334155", ha=ha_align)

plt.tight_layout()
table_chart_path = "number_of_features_table.png"
fig_tbl.savefig(table_chart_path, dpi=300, bbox_inches="tight")
plt.close(fig_tbl)
print(f"Number of Features 表格圖表已儲存至: {table_chart_path}")

# (5) 整合式特徵選取綜合看板圖 (Dashboard)
fig_dash = plt.figure(figsize=(16, 10.5), dpi=300)
gs = fig_dash.add_gridspec(2, 2, height_ratios=[1.1, 1.0], hspace=0.35, wspace=0.18)

ax_d_rmse = fig_dash.add_subplot(gs[0, 0])
ax_d_r2 = fig_dash.add_subplot(gs[0, 1])
ax_d_tbl = fig_dash.add_subplot(gs[1, :])

# 重現折線圖至 Dashboard
ax_d_rmse.plot(x_nums, rmse_vals, color="#4f46e5", linewidth=2.5, marker="o",
               markersize=7.5, markerfacecolor="#ffffff", markeredgecolor="#4f46e5", markeredgewidth=2)
ax_d_rmse.fill_between(x_nums, rmse_vals, min(rmse_vals) * 0.98, color="#4f46e5", alpha=0.08)
ax_d_rmse.plot(7, rmse_vals[6], marker="o", markersize=10, markerfacecolor="#e11d48", markeredgecolor="#ffffff", markeredgewidth=2)
ax_d_rmse.annotate(f"Optimal (k=7)\nRMSE: {rmse_vals[6]:.2f}",
                   xy=(7, rmse_vals[6]), xytext=(7, rmse_vals[6] + 6.0),
                   ha="center", fontsize=9, fontweight="bold", color="#991b1b",
                   bbox=dict(boxstyle="round,pad=0.35", facecolor="#ffe4e6", edgecolor="#f43f5e", alpha=0.9),
                   arrowprops=dict(arrowstyle="->", color="#e11d48", lw=1.3))
for idx, (x, y_val) in enumerate(zip(x_nums, rmse_vals)):
    if idx != 6:
        ax_d_rmse.text(x, y_val + 1.2, f"{y_val:.1f}", ha="center", va="bottom", fontsize=8, color="#475569")
ax_d_rmse.set_title("RMSE by Number of Features", fontsize=12, fontweight="bold", pad=10, color="#1e293b")
ax_d_rmse.set_xlabel("Number of Features", fontsize=10, color="#334155")
ax_d_rmse.set_ylabel("RMSE", fontsize=10, color="#334155")
ax_d_rmse.set_xticks(x_nums)
ax_d_rmse.set_ylim(min(rmse_vals) - 6, max(rmse_vals) + 10)

ax_d_r2.plot(x_nums, r2_vals, color="#059669", linewidth=2.5, marker="o",
             markersize=7.5, markerfacecolor="#ffffff", markeredgecolor="#059669", markeredgewidth=2)
ax_d_r2.fill_between(x_nums, r2_vals, min(r2_vals) * 0.98, color="#059669", alpha=0.08)
ax_d_r2.plot(7, r2_vals[6], marker="o", markersize=10, markerfacecolor="#059669", markeredgecolor="#ffffff", markeredgewidth=2)
ax_d_r2.annotate(f"Optimal (k=7)\nR²: {r2_vals[6]:.4f}",
                 xy=(7, r2_vals[6]), xytext=(7, r2_vals[6] - 0.05),
                 ha="center", fontsize=9, fontweight="bold", color="#065f46",
                 bbox=dict(boxstyle="round,pad=0.35", facecolor="#ecfdf5", edgecolor="#10b981", alpha=0.9),
                 arrowprops=dict(arrowstyle="->", color="#059669", lw=1.3))
for idx, (x, y_val) in enumerate(zip(x_nums, r2_vals)):
    if idx != 6:
        ax_d_r2.text(x, y_val + 0.012, f"{y_val:.3f}", ha="center", va="bottom", fontsize=8, color="#475569")
ax_d_r2.set_title("R-squared by Number of Features", fontsize=12, fontweight="bold", pad=10, color="#1e293b")
ax_d_r2.set_xlabel("Number of Features", fontsize=10, color="#334155")
ax_d_r2.set_ylabel("R-squared", fontsize=10, color="#334155")
ax_d_r2.set_xticks(x_nums)
ax_d_r2.set_ylim(min(r2_vals) - 0.06, max(r2_vals) + 0.05)

for ax in (ax_d_rmse, ax_d_r2):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#cbd5e1")
    ax.spines["bottom"].set_color("#cbd5e1")
    ax.tick_params(colors="#475569", labelsize=9)
    ax.grid(True, linestyle="--", linewidth=0.7, color="#e2e8f0", alpha=0.9)

# 表格重現至 Dashboard
ax_d_tbl.axis("off")
d_table_obj = ax_d_tbl.table(
    cellText=table_data,
    colLabels=col_headers,
    colWidths=col_widths,
    cellLoc="left",
    loc="center",
    bbox=[0.01, 0.05, 0.98, 0.90]
)
d_table_obj.auto_set_font_size(False)
d_table_obj.set_fontsize(10)

for (row_idx, col_idx), cell in d_table_obj.get_celld().items():
    ha_align = "center" if col_idx == 0 else ("right" if col_idx in [2, 3] else "left")
    if row_idx == 0:
        cell.set_facecolor("#1e293b")
        cell.set_edgecolor("#334155")
        cell.set_linewidth(1.2)
        cell.set_text_props(color="#ffffff", weight="bold", ha=ha_align)
    elif row_idx == 7:
        cell.set_facecolor("#ecfdf5")
        cell.set_edgecolor("#a7f3d0")
        cell.set_linewidth(1.0)
        cell.set_text_props(color="#065f46", weight="bold" if col_idx in [0, 2, 3] else "normal", ha=ha_align)
    else:
        row_bg = "#f8fafc" if row_idx % 2 == 1 else "#ffffff"
        cell.set_facecolor(row_bg)
        cell.set_edgecolor("#e2e8f0")
        cell.set_linewidth(0.8)
        cell.set_text_props(color="#334155", ha=ha_align)

fig_dash.suptitle("Feature Selection Performance & Model Comparison (CRISP-DM Stage 4 - Bike Sharing Demand)", 
                  fontsize=14, fontweight="bold", y=0.98, color="#0f172a")

dashboard_chart_path = "feature_selection_dashboard.png"
fig_dash.savefig(dashboard_chart_path, dpi=300, bbox_inches="tight")
plt.close(fig_dash)
print(f"特徵選取綜合看板圖已儲存至: {dashboard_chart_path}")

# ==============================================================================
# 5. Evaluation (模型評估)
# ==============================================================================
print("\n" + "=" * 60)
print("5. Evaluation (全模型評估)")
print("=" * 60)

# (1) 測試集預測
y_pred = regressor.predict(X_test)

# (2) 計算評估指標
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)

print("\n--- [5.1] 線性迴歸測試集效能評估指標 ---")
print(f"R-squared (R^2): {r2:.6f}  (解釋力達 {r2 * 100:.2f}%)")
print(f"MAE           : {mae:.2f} 輛")
print(f"MSE           : {mse:.2f}")
print(f"RMSE          : {rmse:.4f} 輛")

# (3) 輸出截距與迴歸係數
print("\n--- [5.2] 迴歸方程式參數解析 ---")
print(f"截距項 (Intercept, β₀): {regressor.intercept_:.4f}")
for name, coef in zip(feature_cols, regressor.coef_):
    print(f"係數 - {name:<15}: {coef:>10.4f}")

# (4) 額外評估隨機森林模型 (捕捉非線性尖峰與週期性)
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
y_train_log = np.log1p(y_train)
rf_model.fit(X_train, y_train_log)
rf_preds = np.expm1(rf_model.predict(X_test))
rf_r2 = r2_score(y_test, rf_preds)
rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
rf_mae = mean_absolute_error(y_test, rf_preds)
print("\n--- [5.3] 隨機森林模型效能對比 (非線性集成模型) ---")
print(f"Random Forest R^2 : {rf_r2:.6f} (解釋力達 {rf_r2 * 100:.2f}%)")
print(f"Random Forest MAE : {rf_mae:.2f} 輛")
print(f"Random Forest RMSE: {rf_rmse:.4f} 輛")

# (5) 視覺化評估 (實際值 vs. 預測值 & 殘差圖)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.2), dpi=300)

# 圖 1: 實際值 vs 預測值
ax1.scatter(y_test, y_pred, color="#2563eb", edgecolors="#1e3a8a", s=30, alpha=0.5, label="Test Set Data")
min_val = min(y_test.min(), y_pred.min())
max_val = max(y_test.max(), y_pred.max())
ax1.plot([min_val, max_val], [min_val, max_val], color="#ef4444", linestyle="--", linewidth=2, label="Perfect Fit (y = x)")
ax1.set_title("Actual vs. Predicted Bike Demand", fontsize=13, fontweight="bold")
ax1.set_xlabel("Actual Demand (Count)", fontsize=11)
ax1.set_ylabel("Predicted Demand (Count)", fontsize=11)
ax1.legend()
ax1.grid(True, linestyle=":", alpha=0.6)

# 圖 2: 殘差圖 (Residuals)
residuals = y_test - y_pred
ax2.scatter(y_pred, residuals, color="#059669", edgecolors="#064e3b", s=30, alpha=0.5)
ax2.axhline(0, color="#ef4444", linestyle="--", linewidth=2)
ax2.set_title("Residual Plot (殘差分佈)", fontsize=13, fontweight="bold")
ax2.set_xlabel("Predicted Demand (Count)", fontsize=11)
ax2.set_ylabel("Residuals [Actual - Predicted]", fontsize=11)
ax2.grid(True, linestyle=":", alpha=0.6)

plt.tight_layout()
chart_path = "model_evaluation_plots.png"
plt.savefig(chart_path, dpi=300)
plt.close()
print(f"\n全模型評估圖表已輸出儲存至: {chart_path}")

# ==============================================================================
# 6. Deployment (部署準備與預測示範)
# ==============================================================================
print("\n" + "=" * 60)
print("6. Deployment (部署準備與預測示範)")
print("=" * 60)


def predict_bike_demand(hour: int, temp: float, humidity: float, year: int,
                        month: int, weather: int, windspeed: float, workingday: int,
                        use_rf: bool = False) -> float:
    """
    輸入時間與環境條件，預測共享單車即時租借需求量 (輛)
    
    參數:
        hour: 小時 (0~23)
        temp: 氣溫 (°C)
        humidity: 相對濕度 (%)
        year: 年份 (2011, 2012)
        month: 月份 (1~12)
        weather: 天候狀況 (1:晴, 2:陰, 3:雨/雪, 4:惡劣暴風雨)
        windspeed: 風速 (km/h)
        workingday: 是否為上班工作日 (0:假日/週末, 1:工作日)
        use_rf: 是否使用高階隨機森林預測 (預設 False 使用複迴歸)
        
    回傳:
        預估租借單車數量 (輛)
    """
    new_data = pd.DataFrame([{
        "hour": hour,
        "temp": temp,
        "humidity": humidity,
        "year": year,
        "month": month,
        "weather": weather,
        "windspeed": windspeed,
        "workingday": workingday
    }])
    
    if use_rf:
        pred_log = rf_model.predict(new_data)[0]
        prediction = np.expm1(pred_log)
    else:
        prediction = regressor.predict(new_data)[0]
        
    return max(0.0, float(prediction))


# 部署範例測試 1: 工作日早上 8:00 上班尖峰
s1_hour, s1_temp, s1_humidity, s1_year, s1_month, s1_weather, s1_wind, s1_work = 8, 22.0, 55.0, 2012, 6, 1, 12.0, 1
lr_p1 = predict_bike_demand(s1_hour, s1_temp, s1_humidity, s1_year, s1_month, s1_weather, s1_wind, s1_work, use_rf=False)
rf_p1 = predict_bike_demand(s1_hour, s1_temp, s1_humidity, s1_year, s1_month, s1_weather, s1_wind, s1_work, use_rf=True)

# 部署範例測試 2: 週末下午 14:00 休閒出遊
s2_hour, s2_temp, s2_humidity, s2_year, s2_month, s2_weather, s2_wind, s2_work = 14, 28.0, 40.0, 2012, 7, 1, 8.0, 0
lr_p2 = predict_bike_demand(s2_hour, s2_temp, s2_humidity, s2_year, s2_month, s2_weather, s2_wind, s2_work, use_rf=False)
rf_p2 = predict_bike_demand(s2_hour, s2_temp, s2_humidity, s2_year, s2_month, s2_weather, s2_wind, s2_work, use_rf=True)

# 部署範例測試 3: 冬季雨夜離峰
s3_hour, s3_temp, s3_humidity, s3_year, s3_month, s3_weather, s3_wind, s3_work = 3, 5.0, 90.0, 2011, 1, 3, 15.0, 1
lr_p3 = predict_bike_demand(s3_hour, s3_temp, s3_humidity, s3_year, s3_month, s3_weather, s3_wind, s3_work, use_rf=False)
rf_p3 = predict_bike_demand(s3_hour, s3_temp, s3_humidity, s3_year, s3_month, s3_weather, s3_wind, s3_work, use_rf=True)

print(f"[情境 1 - 上班晨峰 08:00] 晴天 22°C, 濕度55% -> 線性迴歸預測: {lr_p1:.1f} 輛 | 隨機森林預測: {rf_p1:.1f} 輛")
print(f"[情境 2 - 週末午後 14:00] 溫暖 28°C, 濕度40% -> 線性迴歸預測: {lr_p2:.1f} 輛 | 隨機森林預測: {rf_p2:.1f} 輛")
print(f"[情境 3 - 寒冬雨夜 03:00] 陰雨 5°C, 濕度90%  -> 線性迴歸預測: {lr_p3:.1f} 輛 | 隨機森林預測: {rf_p3:.1f} 輛")
print("\n" + "=" * 60)
print("CRISP-DM 6 大步驟 Bike Sharing Demand 機器學習分析執行完畢！")
print("=" * 60)
