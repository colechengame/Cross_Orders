/**
 * 醫師BCG矩陣生成器 - Google Sheets (進階整合版)
 * 根據表格中的醫師數據創建波士頓諮詢集團矩陣
 * 整合多維度分析方法論，包括四分位距(IQR)極端值處理、中位數分析、相對增長率及聚類分析
 */

// 全局變量
const GLOBAL = {
  // 數據列索引
  COLUMN_IDX: {
    CLINIC: 0,        // 門店 (A)
    DOCTOR: 1,        // 醫師 (B)
    SESSIONS: 2,      // 診次數 (C)
    TIME_SLOT: 3,     // 時段 (D)
    TOTAL_PATIENTS: 4, // 總人數 (E)
    LASER_PATIENTS: 5, // 雷射人數 (F)
    MICRO_PATIENTS: 6, // 微整人數 (G)
    SURGERY_PATIENTS: 7, // 手術人數 (H)
    WAVE_PATIENTS: 8,  // 電音波人數 (I)
    TOTAL_CONSUMPTION: 9 // 消耗總額 (J)
  },
  // 時段定義
  TIME_SLOTS: ['早診', '午診', '晚診'],
  // 分析日期範圍
  DATE_RANGE: {
    CURRENT: 'current',
    PREVIOUS: 'previous',
    YEAR_TO_DATE: 'ytd'
  },
  // 極端值處理閾值 (乘以IQR的倍數)
  IQR_MULTIPLIER: 1.5
};

/**
 * 主入口函數 - 自動運行所有分析
 */
function AutoRun() {
  try {
  // 獲取必要信息
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // 詢問用戶是否需要處理極端值
  const response = ui.alert(
    '數據處理選項',
    '是否需要處理極端值？這將使用IQR方法識別並調整異常數據。',
    ui.ButtonSet.YES_NO
  );
  
  const handleOutliers = (response === ui.Button.YES);
  
  // 處理主要數據流程
  processEnhancedDoctorData(handleOutliers);

  // 創建所有分析報表
  createAllAnalysisReports();
  
  // 通知用戶完成
  Browser.msgBox("所有分析報表已生成完成！請查看各個工作表進行查看。");
  } catch (error) {
    Logger.log("執行自動分析時發生錯誤: " + error);
    Browser.msgBox("執行自動分析時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 增強版醫師數據處理函數
 * @param {boolean} handleOutliers - 是否處理極端值
 */
function processEnhancedDoctorData(handleOutliers = true) {
  try {
    // 1. 獲取來源工作表
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getActiveSheet();
    
    if (!sourceSheet) {
      Browser.msgBox("無法獲取活動工作表");
      return;
    }

    // 2. 獲取目標工作表，如果不存在則創建
    let destinationSheet = ss.getSheetByName("醫師BCG矩陣分析");
    if (!destinationSheet) {
      destinationSheet = ss.insertSheet("醫師BCG矩陣分析");
    }
    // 清除目標工作表中的現有數據
    destinationSheet.clearContents();

    // 3. 獲取來源工作表的數據
    const data = sourceSheet.getDataRange().getValues();
    
    // 檢查數據格式是否符合預期
    if (data.length <= 1) {
      Browser.msgBox("數據不足，請確保工作表有足夠的數據行");
      return;
    }
    
    // 檢查標題行是否符合預期
    validateHeaders(data[0]);
    
    // 4. 數據前處理
    const processedData = preprocessData(data, handleOutliers);
    
    // 5. 按不同維度進行數據分層
    const { 
      doctorData, 
      clinicData, 
      timeSlotData,
      doctorClinicData,
      doctorTimeSlotData,
      clinicTimeSlotData
    } = stratifyData(processedData);
    
    // 6. 計算統計指標並將所有數據保存到緩存工作表中
    saveDataToCache(ss, doctorData, clinicData, timeSlotData, 
                   doctorClinicData, doctorTimeSlotData, clinicTimeSlotData);
    
    // 7. 生成醫師BCG矩陣
    const doctorMetrics = calculateBCGMetrics(doctorData);
    generateDoctorBCGMatrix(ss, doctorData, doctorMetrics);
    
    // 8. 生成診所BCG矩陣
    const clinicMetrics = calculateBCGMetrics(clinicData);
    generateClinicBCGMatrix(ss, clinicData, clinicMetrics);
    
    // 9. 生成時段BCG矩陣
    const timeSlotMetrics = calculateBCGMetrics(timeSlotData);
    generateTimeSlotBCGMatrix(ss, timeSlotData, timeSlotMetrics);
    
    // 10. 生成綜合績效報告
    generatePerformanceReport(ss, doctorData, clinicData, timeSlotData);
    
    Logger.log("增強版資料處理完成");
    return {
      doctorData, 
      clinicData, 
      timeSlotData,
      doctorClinicData,
      doctorTimeSlotData,
      clinicTimeSlotData
    };
  } catch (error) {
    Logger.log("處理數據時發生錯誤: " + error);
    Browser.msgBox("處理數據時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 驗證數據表頭是否符合預期
 * @param {Array} headers - 表頭行數據
 */
function validateHeaders(headers) {
  const expectedHeaders = ['門店', '醫師', '診次數', '時段', '總人數', '雷射人數', '微整人數', '手術人數', '電音波人數', '消耗總額'];
  
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i]) {
      Browser.msgBox(`標題行不符合預期，請確保第 ${i+1} 列標題為 ${expectedHeaders[i]}`);
      throw new Error(`標題行不符合預期，第 ${i+1} 列應為 ${expectedHeaders[i]}，實際為 ${headers[i]}`);
    }
  }
}

/**
 * 數據前處理：清理數據、處理缺失值、識別並處理極端值
 * @param {Array} data - 原始數據
 * @param {boolean} handleOutliers - 是否處理極端值
 * @return {Array} 處理後的數據
 */
function preprocessData(data, handleOutliers) {
  // 跳過標題行
  const headers = data[0];
  const rows = data.slice(1);
  
  // 過濾無醫師名稱或標記為"無醫師"的行
  let filteredRows = rows.filter(row => {
    const doctorName = row[GLOBAL.COLUMN_IDX.DOCTOR];
    return doctorName && doctorName !== "" && doctorName !== "無醫師";
  });
  
  // 處理缺失值和特殊值
  filteredRows = filteredRows.map(row => {
    const processedRow = [...row];
    
    // 處理診次數、總人數和消耗總額的缺失值
    const sessionsIdx = GLOBAL.COLUMN_IDX.SESSIONS;
    const patientsIdx = GLOBAL.COLUMN_IDX.TOTAL_PATIENTS;
    const consumptionIdx = GLOBAL.COLUMN_IDX.TOTAL_CONSUMPTION;
    
    processedRow[sessionsIdx] = convertToNumber(processedRow[sessionsIdx]);
    processedRow[patientsIdx] = convertToNumber(processedRow[patientsIdx]);
    processedRow[consumptionIdx] = convertToNumber(processedRow[consumptionIdx]);
    
    return processedRow;
  });
  
  // 如果需要處理極端值
  if (handleOutliers) {
    // 使用IQR方法處理極端值
    filteredRows = handleOutliersWithIQR(filteredRows, GLOBAL.COLUMN_IDX.TOTAL_PATIENTS);
    filteredRows = handleOutliersWithIQR(filteredRows, GLOBAL.COLUMN_IDX.TOTAL_CONSUMPTION);
  }
  
  // 返回處理後的數據（保留標題行）
  return [headers, ...filteredRows];
}

/**
 * 將值轉換為數字，處理特殊值
 * @param {any} value - 輸入值
 * @return {number} 轉換後的數字
 */
function convertToNumber(value) {
  if (value === "-" || value === "" || value === null || value === undefined) {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 使用IQR方法處理極端值
 * @param {Array} rows - 數據行
 * @param {number} columnIndex - 要處理的列索引
 * @return {Array} 處理後的數據行
 */
function handleOutliersWithIQR(rows, columnIndex) {
  // 提取該列的所有非零值
  const values = rows
    .map(row => row[columnIndex])
    .filter(val => val > 0)
    .sort((a, b) => a - b);
    
  if (values.length === 0) return rows;
  
  // 計算四分位數
  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  
  // 計算IQR和界限
  const iqr = q3 - q1;
  const lowerBound = q1 - (iqr * GLOBAL.IQR_MULTIPLIER);
  const upperBound = q3 + (iqr * GLOBAL.IQR_MULTIPLIER);
  
  // 處理極端值
  return rows.map(row => {
    const newRow = [...row];
    const value = newRow[columnIndex];
    
    // 只處理非零值
    if (value > 0) {
      if (value < lowerBound) {
        newRow[columnIndex] = lowerBound;
      } else if (value > upperBound) {
        newRow[columnIndex] = upperBound;
      }
    }
    
    return newRow;
  });
}

/**
 * 按不同維度對數據進行分層
 * @param {Array} data - 預處理後的數據
 * @return {Object} 分層後的數據集合
 */
function stratifyData(data) {
  // 跳過標題行
  const rows = data.slice(1);
  
  // 準備不同維度的容器
  const doctorMap = {};
  const clinicMap = {};
  const timeSlotMap = {};
  const doctorClinicMap = {};
  const doctorTimeSlotMap = {};
  const clinicTimeSlotMap = {};
  
  // 處理每一行數據
  rows.forEach(row => {
    const clinic = row[GLOBAL.COLUMN_IDX.CLINIC];
    const doctor = row[GLOBAL.COLUMN_IDX.DOCTOR];
    const sessions = row[GLOBAL.COLUMN_IDX.SESSIONS];
    const timeSlot = row[GLOBAL.COLUMN_IDX.TIME_SLOT];
    const patients = row[GLOBAL.COLUMN_IDX.TOTAL_PATIENTS];
    const consumption = row[GLOBAL.COLUMN_IDX.TOTAL_CONSUMPTION];
    
    // 確保時段有效，如果無效則設為"未知"
    const validTimeSlot = GLOBAL.TIME_SLOTS.includes(timeSlot) ? timeSlot : "未知";
    
    // 更新醫師維度資料
    if (!doctorMap[doctor]) {
      doctorMap[doctor] = createEntityDataStructure(doctor);
    }
    updateEntityData(doctorMap[doctor], sessions, patients, consumption, validTimeSlot);
    
    // 更新診所維度資料
    if (!clinicMap[clinic]) {
      clinicMap[clinic] = createEntityDataStructure(clinic);
    }
    updateEntityData(clinicMap[clinic], sessions, patients, consumption, validTimeSlot);
    
    // 更新時段維度資料
    if (!timeSlotMap[validTimeSlot]) {
      timeSlotMap[validTimeSlot] = createEntityDataStructure(validTimeSlot);
    }
    updateEntityData(timeSlotMap[validTimeSlot], sessions, patients, consumption);
    
    // 更新醫師-診所維度資料
    const doctorClinicKey = `${doctor}_${clinic}`;
    if (!doctorClinicMap[doctorClinicKey]) {
      doctorClinicMap[doctorClinicKey] = createEntityDataStructure(doctor, clinic);
    }
    updateEntityData(doctorClinicMap[doctorClinicKey], sessions, patients, consumption, validTimeSlot);
    
    // 更新醫師-時段維度資料
    const doctorTimeSlotKey = `${doctor}_${validTimeSlot}`;
    if (!doctorTimeSlotMap[doctorTimeSlotKey]) {
      doctorTimeSlotMap[doctorTimeSlotKey] = createEntityDataStructure(doctor, null, validTimeSlot);
    }
    updateEntityData(doctorTimeSlotMap[doctorTimeSlotKey], sessions, patients, consumption);
    
    // 更新診所-時段維度資料
    const clinicTimeSlotKey = `${clinic}_${validTimeSlot}`;
    if (!clinicTimeSlotMap[clinicTimeSlotKey]) {
      clinicTimeSlotMap[clinicTimeSlotKey] = createEntityDataStructure(null, clinic, validTimeSlot);
    }
    updateEntityData(clinicTimeSlotMap[clinicTimeSlotKey], sessions, patients, consumption);
  });
  
  // 計算派生指標
  const doctorData = calculateDerivedMetrics(Object.values(doctorMap));
  const clinicData = calculateDerivedMetrics(Object.values(clinicMap));
  const timeSlotData = calculateDerivedMetrics(Object.values(timeSlotMap));
  const doctorClinicData = calculateDerivedMetrics(Object.values(doctorClinicMap));
  const doctorTimeSlotData = calculateDerivedMetrics(Object.values(doctorTimeSlotMap));
  const clinicTimeSlotData = calculateDerivedMetrics(Object.values(clinicTimeSlotMap));
  
  return {
    doctorData,
    clinicData,
    timeSlotData,
    doctorClinicData,
    doctorTimeSlotData,
    clinicTimeSlotData
  };
}

/**
 * 創建實體數據結構
 * @param {string} doctor - 醫師名稱
 * @param {string} clinic - 診所名稱
 * @param {string} timeSlot - 時段
 * @return {Object} 實體數據結構
 */
function createEntityDataStructure(doctor = null, clinic = null, timeSlot = null) {
  return {
    name: doctor || clinic || timeSlot,
    doctor: doctor,
    clinic: clinic,
    timeSlot: timeSlot,
    sessions: 0,
    patients: 0,
    consumption: 0,
    timeSlots: {
      '早診': 0,
      '午診': 0,
      '晚診': 0,
      '未知': 0
    },
    patientTypes: {
      'laser': 0,   // 雷射人數
      'micro': 0,   // 微整人數
      'surgery': 0, // 手術人數
      'wave': 0     // 電音波人數
    }
  };
}

/**
 * 更新實體數據
 * @param {Object} entity - 實體數據
 * @param {number} sessions - 診次數
 * @param {number} patients - 病患數
 * @param {number} consumption - 消耗額
 * @param {string} timeSlot - 時段
 */
function updateEntityData(entity, sessions, patients, consumption, timeSlot = null) {
  entity.sessions += sessions;
  entity.patients += patients;
  entity.consumption += consumption;
  
  if (timeSlot && entity.timeSlots.hasOwnProperty(timeSlot)) {
    entity.timeSlots[timeSlot] += sessions;
  }
}

/**
 * 計算派生指標
 * @param {Array} entities - 實體數據數組
 * @return {Array} 添加了派生指標的實體數據
 */
function calculateDerivedMetrics(entities) {
  return entities.map(entity => {
    // 計算平均值指標
    if (entity.sessions > 0) {
      entity.patientsPerSession = entity.patients / entity.sessions;
      entity.consumptionPerSession = entity.consumption / entity.sessions;
    } else {
      entity.patientsPerSession = 0;
      entity.consumptionPerSession = 0;
    }
    
    if (entity.patients > 0) {
      entity.consumptionPerPatient = entity.consumption / entity.patients;
    } else {
      entity.consumptionPerPatient = 0;
    }
    
    // 計算主要時段（占比最高的時段）
    let maxSessions = 0;
    let primaryTimeSlot = '';
    
    for (const [slot, count] of Object.entries(entity.timeSlots)) {
      if (count > maxSessions) {
        maxSessions = count;
        primaryTimeSlot = slot;
      }
    }
    
    entity.primaryTimeSlot = primaryTimeSlot;
    
    return entity;
  });
}

/**
 * 將分層數據保存到緩存工作表中
 * @param {SpreadsheetApp.Spreadsheet} ss - 活動的試算表
 * @param {Array} doctorData - 醫師維度數據
 * @param {Array} clinicData - 診所維度數據
 * @param {Array} timeSlotData - 時段維度數據
 * @param {Array} doctorClinicData - 醫師-診所維度數據
 * @param {Array} doctorTimeSlotData - 醫師-時段維度數據
 * @param {Array} clinicTimeSlotData - 診所-時段維度數據
 */
function saveDataToCache(ss, doctorData, clinicData, timeSlotData, 
                        doctorClinicData, doctorTimeSlotData, clinicTimeSlotData) {
  // 創建或獲取緩存工作表
  let cacheSheet = ss.getSheetByName("數據緩存");
  if (!cacheSheet) {
    cacheSheet = ss.insertSheet("數據緩存");
  } else {
    cacheSheet.clear();
  }
  
  // 隱藏緩存工作表
  cacheSheet.hideSheet();
  
  // 將各維度數據保存到緩存工作表中
  saveEntityDataToSheet(cacheSheet, "醫師", doctorData, 1);
  saveEntityDataToSheet(cacheSheet, "診所", clinicData, doctorData.length + 3);
  saveEntityDataToSheet(cacheSheet, "時段", timeSlotData, doctorData.length + clinicData.length + 5);
  saveEntityDataToSheet(cacheSheet, "醫師_診所", doctorClinicData, 
                        doctorData.length + clinicData.length + timeSlotData.length + 7);
}

/**
 * 將實體數據保存到工作表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} entityType - 實體類型名稱
 * @param {Array} entities - 實體數據數組
 * @param {number} startRow - 開始行
 */
function saveEntityDataToSheet(sheet, entityType, entities, startRow) {
  // 寫入分區標題
  sheet.getRange(startRow, 1).setValue(entityType + "維度數據");
  sheet.getRange(startRow, 1).setFontWeight("bold");
  
  // 寫入表頭
  const headers = [
    "名稱", "醫師", "診所", "時段", "診次數", "總人數", "總消耗額", 
    "每診患者數", "每診消耗額", "每人消耗額", "主要時段",
    "早診次數", "午診次數", "晚診次數"
  ];
  
  sheet.getRange(startRow + 1, 1, 1, headers.length).setValues([headers]);
  
  // 寫入數據
  const dataToWrite = entities.map(entity => [
    entity.name,
    entity.doctor || "",
    entity.clinic || "",
    entity.timeSlot || "",
    entity.sessions,
    entity.patients,
    entity.consumption,
    entity.patientsPerSession,
    entity.consumptionPerSession,
    entity.consumptionPerPatient,
    entity.primaryTimeSlot || "",
    entity.timeSlots["早診"],
    entity.timeSlots["午診"],
    entity.timeSlots["晚診"]
  ]);
  
  if (dataToWrite.length > 0) {
    sheet.getRange(startRow + 2, 1, dataToWrite.length, headers.length).setValues(dataToWrite);
  }
}

/**
 * 計算BCG矩陣所需的指標
 * @param {Array} entities - 實體數據數組
 * @return {Object} BCG矩陣指標
 */
function calculateBCGMetrics(entities) {
  // 過濾掉無效實體（無診次的實體）
  const validEntities = entities.filter(entity => entity.sessions > 0);
  
  if (validEntities.length === 0) {
    return {
      medianPatientsPerSession: 0,
      medianConsumptionPerPatient: 0,
      quartiles: {
        patients: { q1: 0, q3: 0 },
        consumption: { q1: 0, q3: 0 }
      }
    };
  }
  
  // 計算每診患者數的中位數和四分位數
  const sortedPatients = validEntities
    .filter(e => e.patientsPerSession > 0)
    .map(e => e.patientsPerSession)
    .sort((a, b) => a - b);
  
  // 計算每人消耗額的中位數和四分位數
  const sortedConsumption = validEntities
    .filter(e => e.consumptionPerPatient > 0)
    .map(e => e.consumptionPerPatient)
    .sort((a, b) => a - b);
  
  // 計算中位數
  const medianPatientsPerSession = calculateMedian(sortedPatients);
  const medianConsumptionPerPatient = calculateMedian(sortedConsumption);
  
  // 計算四分位數
  const patientsQ1 = calculateQuantile(sortedPatients, 0.25);
  const patientsQ3 = calculateQuantile(sortedPatients, 0.75);
  const consumptionQ1 = calculateQuantile(sortedConsumption, 0.25);
  const consumptionQ3 = calculateQuantile(sortedConsumption, 0.75);
  
  return {
    medianPatientsPerSession,
    medianConsumptionPerPatient,
    quartiles: {
      patients: { q1: patientsQ1, q3: patientsQ3 },
      consumption: { q1: consumptionQ1, q3: consumptionQ3 }
    }
  };
}

/**
 * 計算中位數
 * @param {Array} values - 數值數組
 * @return {number} 中位數
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  
  const mid = Math.floor(values.length / 2);
  
  if (values.length % 2 === 0) {
    return (values[mid - 1] + values[mid]) / 2;
  } else {
    return values[mid];
  }
}

/**
 * 計算分位數
 * @param {Array} values - 數值數組
 * @param {number} q - 分位數（0-1之間）
 * @return {number} 對應分位數的值
 */
function calculateQuantile(values, q) {
  if (values.length === 0) return 0;
  
  const pos = (values.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  
  if (values[base + 1] !== undefined) {
    return values[base] + rest * (values[base + 1] - values[base]);
  } else {
    return values[base];
  }
}

/**
 * 生成醫師BCG矩陣
 * @param {SpreadsheetApp.Spreadsheet} ss - 活動的試算表
 * @param {Array} doctorData - 醫師維度數據
 * @param {Object} metrics - BCG矩陣指標
 */
function generateDoctorBCGMatrix(ss, doctorData, metrics) {
  try {
  // 創建BCG矩陣工作表
  let bcgSheet = ss.getSheetByName("醫師BCG矩陣");
  if (!bcgSheet) {
    bcgSheet = ss.insertSheet("醫師BCG矩陣");
  } else {
    bcgSheet.clear();
  }
  
  // 設置矩陣布局
  setupBCGMatrixLayout(
    bcgSheet, 
    "醫師BCG矩陣分析",
    "每診患者人數", 
    "每人消耗額", 
    metrics.medianPatientsPerSession, 
    metrics.medianConsumptionPerPatient,
    metrics.quartiles
  );
  
  // 繪製數據點
  plotBCGData(
    bcgSheet, 
    doctorData.filter(d => d.sessions > 0), 
    metrics.medianPatientsPerSession, 
    metrics.medianConsumptionPerPatient
  );
  
  // 添加圖例
  addBCGLegend(bcgSheet, "醫師");
  
  // 添加醫師數據表
  addDoctorDataTable(bcgSheet, doctorData, metrics);
  } catch (error) {
    Logger.log("繪製醫師BCG矩陣時發生錯誤: " + error);
    Browser.msgBox("繪製醫師BCG矩陣時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 生成診所BCG矩陣
 * @param {SpreadsheetApp.Spreadsheet} ss - 活動的試算表
 * @param {Array} clinicData - 診所維度數據
 * @param {Object} metrics - BCG矩陣指標
 */
function generateClinicBCGMatrix(ss, clinicData, metrics) {
  try {
  // 創建BCG矩陣工作表
  let bcgSheet = ss.getSheetByName("診所BCG矩陣");
  if (!bcgSheet) {
    bcgSheet = ss.insertSheet("診所BCG矩陣");
  } else {
    bcgSheet.clear();
  }
  
  // 設置矩陣布局
  setupBCGMatrixLayout(
    bcgSheet, 
    "診所BCG矩陣分析",
    "每診患者人數", 
    "每人消耗額", 
    metrics.medianPatientsPerSession, 
    metrics.medianConsumptionPerPatient,
    metrics.quartiles
  );
  
  // 繪製數據點
  plotBCGData(
    bcgSheet, 
    clinicData.filter(d => d.sessions > 0), 
    metrics.medianPatientsPerSession, 
    metrics.medianConsumptionPerPatient
  );
  
  // 添加圖例
  addBCGLegend(bcgSheet, "診所");
  
  // 添加診所數據表
  addClinicDataTable(bcgSheet, clinicData, metrics);
  } catch (error) {
    Logger.log("繪製診所BCG矩陣時發生錯誤: " + error);
    Browser.msgBox("繪製診所BCG矩陣時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 生成時段BCG矩陣
 * @param {SpreadsheetApp.Spreadsheet} ss - 活動的試算表
 * @param {Array} timeSlotData - 時段維度數據
 * @param {Object} metrics - BCG矩陣指標
 */
function generateTimeSlotBCGMatrix(ss, timeSlotData, metrics) {
  try {
  // 創建BCG矩陣工作表
  let bcgSheet = ss.getSheetByName("時段BCG矩陣");
  if (!bcgSheet) {
    bcgSheet = ss.insertSheet("時段BCG矩陣");
  } else {
    bcgSheet.clear();
  }
  
  // 設置矩陣布局
  setupBCGMatrixLayout(
    bcgSheet, 
    "時段BCG矩陣分析",
    "每診患者人數", 
    "每人消耗額", 
    metrics.medianPatientsPerSession, 
    metrics.medianConsumptionPerPatient,
    metrics.quartiles
  );
  
  // 繪製數據點
  plotBCGData(
    bcgSheet, 
    timeSlotData.filter(d => d.sessions > 0), 
    metrics.medianPatientsPerSession, 
    metrics.medianConsumptionPerPatient
  );
  
  // 添加圖例
  addBCGLegend(bcgSheet, "時段");
  
  // 添加時段數據表
  addTimeSlotDataTable(bcgSheet, timeSlotData, metrics);
  } catch (error) {
    Logger.log("繪製時段BCG矩陣時發生錯誤: " + error);
    Browser.msgBox("繪製時段BCG矩陣時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 設置BCG矩陣布局
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} title - 矩陣標題
 * @param {string} yAxisTitle - Y軸標題
 * @param {string} xAxisTitle - X軸標題
 * @param {number} avgYValue - Y軸平均值
 * @param {number} avgXValue - X軸平均值
 * @param {Object} quartiles - 四分位數據
 */
function setupBCGMatrixLayout(sheet, title, yAxisTitle, xAxisTitle, avgYValue, avgXValue, quartiles) {
  // 設置列寬和行高
  sheet.setColumnWidth(1, 150);
  
  // 設置B-U列(2-21)的寬度完全相同
  const standardColumnWidth = 30;
  for (var i = 2; i <= 21; i++) {
    sheet.setColumnWidth(i, standardColumnWidth);
  }
  
  // 設置1-20行的高度完全相同
  const standardRowHeight = 25;
  for (var i = 1; i <= 20; i++) {
    sheet.setRowHeight(i, standardRowHeight);
  }
  
  // 設置標題
  sheet.getRange("A1:U1").merge();
  sheet.getRange("A1").setValue(title).setFontWeight("bold").setHorizontalAlignment("center");
  
  // 繪製象限線
  var quadrantRange = sheet.getRange("B2:U21");
  quadrantRange.setBorder(true, true, true, true, true, true);
  
  // 垂直分隔線（中線）
  var verticalLine = sheet.getRange("L2:L21");
  verticalLine.setBorder(null, true, null, true, null, null, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // 水平分隔線（中線）
  var horizontalLine = sheet.getRange("B11:U11");
  horizontalLine.setBorder(true, null, true, null, null, null, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // 添加象限標籤（使用中位數而非平均值）
  sheet.getRange("Q4").setValue("高效優勢型 (High Performance)").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("F4").setValue("高量低效型 (High Volume)").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("Q16").setValue("精品專科型 (Premium Specialty)").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("F16").setValue("績效待提升型 (Improvement Needed)").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加坐標軸標籤
  sheet.getRange("L22").setValue(xAxisTitle).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("A11").setValue(yAxisTitle).setFontWeight("bold").setVerticalAlignment("middle");
  
  // 為象限輕微著色
  sheet.getRange("B2:K10").setBackground("#fff2cc");  // 高量低效型 (黃色)
  sheet.getRange("M2:U10").setBackground("#d9ead3");  // 高效優勢型 (綠色)
  sheet.getRange("B12:K21").setBackground("#f4cccc"); // 績效待提升型 (紅色)
  sheet.getRange("M12:U21").setBackground("#cfe2f3"); // 精品專科型 (藍色)
  
  // 添加高/低軸標籤
  sheet.getRange("B22").setValue("低").setFontStyle("italic");
  sheet.getRange("U22").setValue("高").setFontStyle("italic");
  sheet.getRange("A2").setValue("高").setFontStyle("italic");
  sheet.getRange("A21").setValue("低").setFontStyle("italic");
  
  // 添加中位數參考值
  sheet.getRange("W3").setValue("中位數參考線：").setFontWeight("bold");
  sheet.getRange("W4").setValue(yAxisTitle + " 中位數:");
  sheet.getRange("W5").setValue(xAxisTitle + " 中位數:");
  sheet.getRange("X4").setValue(avgYValue);
  sheet.getRange("X5").setValue(avgXValue);
  
  // 添加四分位數參考值
  sheet.getRange("W7").setValue("四分位數 (IQR)：").setFontWeight("bold");
  sheet.getRange("W8").setValue(yAxisTitle + " Q1:");
  sheet.getRange("W9").setValue(yAxisTitle + " Q3:");
  sheet.getRange("W10").setValue(xAxisTitle + " Q1:");
  sheet.getRange("W11").setValue(xAxisTitle + " Q3:");
  sheet.getRange("X8").setValue(quartiles.patients.q1);
  sheet.getRange("X9").setValue(quartiles.patients.q3);
  sheet.getRange("X10").setValue(quartiles.consumption.q1);
  sheet.getRange("X11").setValue(quartiles.consumption.q3);
}

/**
 * 在BCG矩陣上繪製數據點
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} data - 要繪製的數據
 * @param {number} avgYValue - Y軸平均值（中位數）
 * @param {number} avgXValue - X軸平均值（中位數）
 */
function plotBCGData(sheet, data, avgYValue, avgXValue) {
  try {
  // 在工作表底部創建數據表
  var headerRow = sheet.getRange("A24:I24");
  headerRow.setValues([["名稱", "診次數", "總人數", "每診患者人數", "總銷耗", "每人消耗額", "每診消耗額", "主要時段", "BCG分類"]]);
  headerRow.setFontWeight("bold");
  
  // 獲取最大和最小值，用於正確定位點
  var allConsumptionPerPatient = data.map(d => d.consumptionPerPatient).filter(v => v > 0);
  var allPatientsPerSession = data.map(d => d.patientsPerSession).filter(v => v > 0);
  
  if (allConsumptionPerPatient.length === 0 || allPatientsPerSession.length === 0) {
    return; // 沒有有效數據
  }
  
  var maxConsumption = Math.max(...allConsumptionPerPatient, avgXValue * 2);
  var minConsumption = Math.min(...allConsumptionPerPatient, 0);
  var maxPatients = Math.max(...allPatientsPerSession, avgYValue * 2);
  var minPatients = Math.min(...allPatientsPerSession, 0);
  
  // 獲取總消耗的最大和最小值，用於氣泡大小
  var allConsumptions = data.map(d => d.consumption).filter(v => v > 0);
  var minTotalConsumption = Math.min(...allConsumptions);
  var maxTotalConsumption = Math.max(...allConsumptions);
  
  // 將數據添加到表格並繪製在矩陣上
  for (var i = 0; i < data.length; i++) {
    const entity = data[i];
    
    // 只處理有診次的實體
    if (entity.sessions <= 0) continue;
    
    var entityName = entity.name;
    var patientsPerSession = entity.patientsPerSession;
    var consumptionPerPatient = entity.consumptionPerPatient;
    var totalConsumption = entity.consumption;
    
    // 判斷象限
    var isHighPatients = patientsPerSession >= avgYValue;
    var isHighConsumption = consumptionPerPatient >= avgXValue;
    
    var bcgCategory = "";
    if (isHighPatients && isHighConsumption) {
      bcgCategory = "高效優勢型 (High Performance)";
    } else if (isHighPatients && !isHighConsumption) {
      bcgCategory = "高量低效型 (High Volume)";
    } else if (!isHighPatients && isHighConsumption) {
      bcgCategory = "精品專科型 (Premium Specialty)";
    } else {
      bcgCategory = "績效待提升型 (Improvement Needed)";
    }
    
    // 添加到數據表
    sheet.getRange(25 + i, 1, 1, 9).setValues([[
      entityName,
      entity.sessions,
      entity.patients,
      patientsPerSession,
      totalConsumption,
      consumptionPerPatient,
      entity.consumptionPerSession,
      entity.primaryTimeSlot || "",
      bcgCategory
    ]]);
    
    // 根據BCG類別設置顏色
    if (bcgCategory === "高效優勢型 (High Performance)") {
      sheet.getRange(25 + i, 9).setBackground("#d9ead3");
    } else if (bcgCategory === "高量低效型 (High Volume)") {
      sheet.getRange(25 + i, 9).setBackground("#fff2cc");
    } else if (bcgCategory === "精品專科型 (Premium Specialty)") {
      sheet.getRange(25 + i, 9).setBackground("#cfe2f3");
    } else {
      sheet.getRange(25 + i, 9).setBackground("#f4cccc");
    }
    
    // 計算矩陣中的位置
    var colStart, rowStart;
    
    if (isHighConsumption) {
      colStart = 13; // 右半區 (M-U)
    } else {
      colStart = 2;  // 左半區 (B-K)
    }
    
    if (isHighPatients) {
      rowStart = 2;  // 上半區 (2-10)
    } else {
      rowStart = 12; // 下半區 (12-21)
    }
    
    // 計算在象限內的相對位置
    var colOffset, rowOffset;
    
    if (isHighConsumption) {
      var range = maxConsumption - avgXValue;
      if (range > 0) {
        var relativePosition = (consumptionPerPatient - avgXValue) / range;
        colOffset = Math.floor(relativePosition * 8);
        colOffset = Math.min(8, Math.max(0, colOffset));
      } else {
        colOffset = 4;
      }
    } else {
      var range = avgXValue - minConsumption;
      if (range > 0) {
        var relativePosition = (avgXValue - consumptionPerPatient) / range;
        colOffset = 8 - Math.floor(relativePosition * 8);
        colOffset = Math.min(8, Math.max(0, colOffset));
      } else {
        colOffset = 4;
      }
    }
    
    if (isHighPatients) {
      var range = maxPatients - avgYValue;
      if (range > 0) {
        var relativePosition = (patientsPerSession - avgYValue) / range;
        rowOffset = Math.floor(relativePosition * 8);
        rowOffset = Math.min(8, Math.max(0, rowOffset));
      } else {
        rowOffset = 4;
      }
    } else {
      var range = avgYValue - minPatients;
      if (range > 0) {
        var relativePosition = (avgYValue - patientsPerSession) / range;
        rowOffset = 8 - Math.floor(relativePosition * 8);
        rowOffset = Math.min(8, Math.max(0, rowOffset));
      } else {
        rowOffset = 4;
      }
    }
    
    // 特殊情況處理
    if (patientsPerSession === 0) {
      rowOffset = 8;
    }
    
    if (consumptionPerPatient === 0) {
      colOffset = 0;
    }
    
    // 最終位置
    var col = colStart + colOffset;
    var row = rowStart + rowOffset;
    
    // 確保列和行在範圍內
    col = Math.max(2, Math.min(21, col));
    row = Math.max(2, Math.min(21, row));
    
    // 計算氣泡大小（根據總銷耗的相對大小）
    var normalizedConsumption = 0;
    if (maxTotalConsumption > minTotalConsumption) {
      normalizedConsumption = (totalConsumption - minTotalConsumption) / (maxTotalConsumption - minTotalConsumption);
    }
    
    // 使用固定的字體大小，以確保所有名稱的字體一致
    var fontSize = 10;
    
    // 繪製氣泡
    var cell = sheet.getRange(row, col);
    cell.setValue(entityName);
    
    // 根據象限設置氣泡樣式
    if (isHighConsumption) {
      if (isHighPatients) {
        // 右上: 高效優勢型
        cell.setBackground("#93C47D").setFontColor("#000000");
      } else {
        // 右下: 精品專科型
        cell.setBackground("#9FC5E8").setFontColor("#000000");
      }
    } else {
      if (isHighPatients) {
        // 左上: 高量低效型
        cell.setBackground("#FFD966").setFontColor("#000000");
      } else {
        // 左下: 績效待提升型
        cell.setBackground("#EA9999").setFontColor("#000000");
      }
    }
    
    // 設置統一的字體大小和對齊方式
    cell.setFontSize(fontSize);
    cell.setHorizontalAlignment("center");
    cell.setVerticalAlignment("middle");
    
    // 添加註釋以顯示浮動資訊
    var tooltipContent = 
      "名稱: " + entityName + "\n" +
      "每診患者數: " + patientsPerSession.toFixed(2) + "\n" +
      "每人消耗額: " + consumptionPerPatient.toFixed(2) + "\n" +
      "總銷耗: " + totalConsumption.toLocaleString() + "\n" +
      "總診次: " + entity.sessions + "\n" +
      "總人數: " + entity.patients + "\n" +
      "主要時段: " + (entity.primaryTimeSlot || "無") + "\n" +
      "分類: " + bcgCategory;
    
    cell.setNote(tooltipContent);
  }
  
  // 設置固定欄寬，不使用自動調整
  for (let i = 0; i < 9; i++) {
    sheet.setColumnWidth(i + 1, i === 0 ? 150 : 120);
  }
  } catch (error) {
    Logger.log("在plotBCGData函數中發生錯誤: " + error);
    Browser.msgBox("在plotBCGData函數中發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 為BCG矩陣添加圖例
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} entityType - 實體類型（醫師/診所/時段）
 */
function addBCGLegend(sheet, entityType) {
  var legendRange = sheet.getRange("W13:AB22");
  legendRange.setBorder(true, true, true, true, true, true);
  
  sheet.getRange("W13:AB13").merge().setValue(entityType + "BCG矩陣圖例").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 象限描述
  sheet.getRange("W15:AB15").merge().setValue("象限描述：").setFontWeight("bold");
  
  sheet.getRange("W16").setBackground("#d9ead3");
  sheet.getRange("X16:AB16").merge().setValue("高效優勢型：高每診患者人數、高每人消耗額");
  
  sheet.getRange("W17").setBackground("#fff2cc");
  sheet.getRange("X17:AB17").merge().setValue("高量低效型：高每診患者人數、低每人消耗額");
  
  sheet.getRange("W18").setBackground("#cfe2f3");
  sheet.getRange("X18:AB18").merge().setValue("精品專科型：低每診患者人數、高每人消耗額");
  
  sheet.getRange("W19").setBackground("#f4cccc");
  sheet.getRange("X19:AB19").merge().setValue("績效待提升型：低每診患者人數、低每人消耗額");
  
  // 分析方法說明
  sheet.getRange("W21:AB21").merge().setValue("分析方法：").setFontWeight("bold");
  sheet.getRange("W22:AB22").merge().setValue("使用中位數分析代替平均值，降低極端值影響");
}

/**
 * 添加醫師數據表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorData - 醫師數據
 * @param {Object} metrics - BCG矩陣指標
 */
function addDoctorDataTable(sheet, doctorData, metrics) {
  // 已在plotBCGData中添加基本數據表
  // 這裡可以擴展為添加特定於醫師維度的其他指標
}

/**
 * 添加診所數據表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} clinicData - 診所數據
 * @param {Object} metrics - BCG矩陣指標
 */
function addClinicDataTable(sheet, clinicData, metrics) {
  // 已在plotBCGData中添加基本數據表
  // 這裡可以擴展為添加特定於診所維度的其他指標
}

/**
 * 添加時段數據表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} timeSlotData - 時段數據
 * @param {Object} metrics - BCG矩陣指標
 */
function addTimeSlotDataTable(sheet, timeSlotData, metrics) {
  // 已在plotBCGData中添加基本數據表
  // 這裡可以擴展為添加特定於時段維度的其他指標
}

/**
 * 生成綜合績效報告
 * @param {SpreadsheetApp.Spreadsheet} ss - 試算表
 * @param {Array} doctorData - 醫師數據
 * @param {Array} clinicData - 診所數據
 * @param {Array} timeSlotData - 時段數據
 */
function generatePerformanceReport(ss, doctorData, clinicData, timeSlotData) {
  // 創建績效報告工作表
  let reportSheet = ss.getSheetByName("績效綜合報告");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("績效綜合報告");
  } else {
    reportSheet.clear();
  }
  
  // 設置標題
  reportSheet.getRange("A1:J1").merge();
  reportSheet.getRange("A1").setValue("醫療診所綜合績效分析報告").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加醫師績效部分
  addDoctorPerformanceSection(reportSheet, doctorData, 3);
  
  // 添加診所績效部分
  const doctorSectionRows = doctorData.length + 5;
  addClinicPerformanceSection(reportSheet, clinicData, doctorSectionRows);
  
  // 添加時段績效部分
  const clinicSectionRows = doctorSectionRows + clinicData.length + 5;
  addTimeSlotPerformanceSection(reportSheet, timeSlotData, clinicSectionRows);
  
  // 添加最佳配置建議部分
  const timeSlotSectionRows = clinicSectionRows + timeSlotData.length + 5;
  addOptimizationSuggestions(reportSheet, doctorData, clinicData, timeSlotData, timeSlotSectionRows);
  
  // 格式化整個報告
  reportSheet.autoResizeColumns(1, 10);
}

/**
 * 添加醫師績效部分
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorData - 醫師數據
 * @param {number} startRow - 開始行
 * @return {number} 下一個可用行
 */
function addDoctorPerformanceSection(sheet, doctorData, startRow) {
  // 設置段落標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("1. 醫師績效分析").setFontWeight("bold");
  
  // 增加部分說明
  sheet.getRange(`A${startRow+1}:J${startRow+1}`).merge();
  sheet.getRange(`A${startRow+1}`).setValue("以下列出醫師績效指標，按總消耗額降序排列。BCG分類基於中位數分析，減少極端值影響。");
  
  // 表頭
  const headers = ["醫師名稱", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "主要時段", "BCG分類", "績效評級"];
  sheet.getRange(`A${startRow+3}:J${startRow+3}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  
  // 排序醫師數據（按總消耗額降序）
  const sortedDoctors = doctorData
    .filter(doc => doc.sessions > 0)
    .sort((a, b) => b.consumption - a.consumption);
    
  // 計算四分位數，用於績效評級
  const consumptions = sortedDoctors.map(d => d.consumption);
  const q1 = calculateQuantile(consumptions, 0.25);
  const q2 = calculateQuantile(consumptions, 0.5);
  const q3 = calculateQuantile(consumptions, 0.75);
  
  // 添加醫師數據
  if (sortedDoctors.length > 0) {
    const doctorRows = sortedDoctors.map(doctor => {
      // 確定BCG分類
      let bcgCategory;
      if (doctor.patientsPerSession >= calculateMedian(sortedDoctors.map(d => d.patientsPerSession)) && 
          doctor.consumptionPerPatient >= calculateMedian(sortedDoctors.map(d => d.consumptionPerPatient))) {
        bcgCategory = "高效優勢型";
      } else if (doctor.patientsPerSession >= calculateMedian(sortedDoctors.map(d => d.patientsPerSession))) {
        bcgCategory = "高量低效型";
      } else if (doctor.consumptionPerPatient >= calculateMedian(sortedDoctors.map(d => d.consumptionPerPatient))) {
        bcgCategory = "精品專科型";
      } else {
        bcgCategory = "績效待提升型";
      }
      
      // 確定績效評級
      let performanceRating;
      if (doctor.consumption >= q3) {
        performanceRating = "A (頂尖)";
      } else if (doctor.consumption >= q2) {
        performanceRating = "B (優秀)";
      } else if (doctor.consumption >= q1) {
        performanceRating = "C (普通)";
      } else {
        performanceRating = "D (待提升)";
      }
      
      return [
        doctor.name,
        doctor.sessions,
        doctor.patients,
        doctor.consumption,
        doctor.patientsPerSession.toFixed(2),
        doctor.consumptionPerSession.toFixed(2),
        doctor.consumptionPerPatient.toFixed(2),
        doctor.primaryTimeSlot || "無",
        bcgCategory,
        performanceRating
      ];
    });
    
    sheet.getRange(startRow + 4, 1, doctorRows.length, 10).setValues(doctorRows);
    
    // 為績效評級設置顏色
    for (let i = 0; i < doctorRows.length; i++) {
      const rating = doctorRows[i][9];
      if (rating.startsWith("A")) {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#d9ead3"); // 綠色
      } else if (rating.startsWith("B")) {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#fff2cc"); // 黃色
      } else if (rating.startsWith("C")) {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#cfe2f3"); // 藍色
      } else {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#f4cccc"); // 紅色
      }
    }
  }
  
  return startRow + 4 + sortedDoctors.length;
}

/**
 * 添加診所績效部分
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} clinicData - 診所數據
 * @param {number} startRow - 開始行
 * @return {number} 下一個可用行
 */
function addClinicPerformanceSection(sheet, clinicData, startRow) {
  // 設置段落標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("2. 診所績效分析").setFontWeight("bold");
  
  // 增加部分說明
  sheet.getRange(`A${startRow+1}:J${startRow+1}`).merge();
  sheet.getRange(`A${startRow+1}`).setValue("以下列出各診所績效指標，並包含市場份額計算（按總消耗額比例）。");
  
  // 表頭
  const headers = ["診所名稱", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "市場份額", "BCG分類", "效能指數"];
  sheet.getRange(`A${startRow+3}:J${startRow+3}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  
  // 排序診所數據（按總消耗額降序）
  const sortedClinics = clinicData
    .filter(clinic => clinic.sessions > 0)
    .sort((a, b) => b.consumption - a.consumption);
    
  // 計算市場總額
  const totalMarketSize = sortedClinics.reduce((sum, clinic) => sum + clinic.consumption, 0);
  
  // 計算四分位數，用於效能指數
  const consumptions = sortedClinics.map(d => d.consumption);
  const efficiencies = sortedClinics.map(d => d.consumptionPerSession);
  const q1 = calculateQuantile(efficiencies, 0.25);
  const q2 = calculateQuantile(efficiencies, 0.5);
  const q3 = calculateQuantile(efficiencies, 0.75);
  
  // 添加診所數據
  if (sortedClinics.length > 0) {
    const clinicRows = sortedClinics.map(clinic => {
      // 確定BCG分類
      let bcgCategory;
      if (clinic.patientsPerSession >= calculateMedian(sortedClinics.map(d => d.patientsPerSession)) && 
          clinic.consumptionPerPatient >= calculateMedian(sortedClinics.map(d => d.consumptionPerPatient))) {
        bcgCategory = "高效優勢型";
      } else if (clinic.patientsPerSession >= calculateMedian(sortedClinics.map(d => d.patientsPerSession))) {
        bcgCategory = "高量低效型";
      } else if (clinic.consumptionPerPatient >= calculateMedian(sortedClinics.map(d => d.consumptionPerPatient))) {
        bcgCategory = "精品專科型";
      } else {
        bcgCategory = "績效待提升型";
      }
      
      // 計算市場份額
      const marketShare = (clinic.consumption / totalMarketSize * 100).toFixed(2) + "%";
      
      // 確定效能指數
      let efficiencyIndex;
      if (clinic.consumptionPerSession >= q3) {
        efficiencyIndex = "高效 (>75%)";
      } else if (clinic.consumptionPerSession >= q2) {
        efficiencyIndex = "良好 (>50%)";
      } else if (clinic.consumptionPerSession >= q1) {
        efficiencyIndex = "普通 (>25%)";
      } else {
        efficiencyIndex = "低效 (<25%)";
      }
      
      return [
        clinic.name,
        clinic.sessions,
        clinic.patients,
        clinic.consumption,
        clinic.patientsPerSession.toFixed(2),
        clinic.consumptionPerSession.toFixed(2),
        clinic.consumptionPerPatient.toFixed(2),
        marketShare,
        bcgCategory,
        efficiencyIndex
      ];
    });
    
    sheet.getRange(startRow + 4, 1, clinicRows.length, 10).setValues(clinicRows);
    
    // 為效能指數設置顏色
    for (let i = 0; i < clinicRows.length; i++) {
      const efficiency = clinicRows[i][9];
      if (efficiency.startsWith("高效")) {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#d9ead3"); // 綠色
      } else if (efficiency.startsWith("良好")) {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#fff2cc"); // 黃色
      } else if (efficiency.startsWith("普通")) {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#cfe2f3"); // 藍色
      } else {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#f4cccc"); // 紅色
      }
    }
  }
  
  return startRow + 4 + sortedClinics.length;
}

/**
 * 添加時段績效部分
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} timeSlotData - 時段數據
 * @param {number} startRow - 開始行
 * @return {number} 下一個可用行
 */
function addTimeSlotPerformanceSection(sheet, timeSlotData, startRow) {
  // 設置段落標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("3. 時段績效分析").setFontWeight("bold");
  
  // 增加部分說明
  sheet.getRange(`A${startRow+1}:J${startRow+1}`).merge();
  sheet.getRange(`A${startRow+1}`).setValue("以下列出各時段（早診/午診/晚診）績效指標，用於確定資源分配最優時段。");
  
  // 表頭
  const headers = ["時段", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "診次占比", "BCG分類", "建議"];
  sheet.getRange(`A${startRow+3}:J${startRow+3}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  
  // 篩選有效時段數據（排除"未知"時段）
  const validTimeSlots = timeSlotData
    .filter(ts => ts.sessions > 0 && GLOBAL.TIME_SLOTS.includes(ts.name))
    .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
    
  // 計算總診次
  const totalSessions = validTimeSlots.reduce((sum, ts) => sum + ts.sessions, 0);
  
  // 添加時段數據
  if (validTimeSlots.length > 0) {
    const timeSlotRows = validTimeSlots.map(timeSlot => {
      // 確定BCG分類
      let bcgCategory;
      if (timeSlot.patientsPerSession >= calculateMedian(validTimeSlots.map(d => d.patientsPerSession)) && 
          timeSlot.consumptionPerPatient >= calculateMedian(validTimeSlots.map(d => d.consumptionPerPatient))) {
        bcgCategory = "高效優勢型";
      } else if (timeSlot.patientsPerSession >= calculateMedian(validTimeSlots.map(d => d.patientsPerSession))) {
        bcgCategory = "高量低效型";
      } else if (timeSlot.consumptionPerPatient >= calculateMedian(validTimeSlots.map(d => d.consumptionPerPatient))) {
        bcgCategory = "精品專科型";
      } else {
        bcgCategory = "績效待提升型";
      }
      
      // 計算診次占比
      const sessionPercentage = (timeSlot.sessions / totalSessions * 100).toFixed(2) + "%";
      
      // 生成建議
      let recommendation;
      if (timeSlot.consumptionPerSession >= calculateMedian(validTimeSlots.map(d => d.consumptionPerSession)) * 1.2) {
        recommendation = "增加診次配置";
      } else if (timeSlot.consumptionPerSession <= calculateMedian(validTimeSlots.map(d => d.consumptionPerSession)) * 0.8) {
        recommendation = "減少診次配置";
      } else {
        recommendation = "維持現有配置";
      }
      
      return [
        timeSlot.name,
        timeSlot.sessions,
        timeSlot.patients,
        timeSlot.consumption,
        timeSlot.patientsPerSession.toFixed(2),
        timeSlot.consumptionPerSession.toFixed(2),
        timeSlot.consumptionPerPatient.toFixed(2),
        sessionPercentage,
        bcgCategory,
        recommendation
      ];
    });
    
    sheet.getRange(startRow + 4, 1, timeSlotRows.length, 10).setValues(timeSlotRows);
    
    // 為建議設置顏色
    for (let i = 0; i < timeSlotRows.length; i++) {
      const recommendation = timeSlotRows[i][9];
      if (recommendation === "增加診次配置") {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#d9ead3"); // 綠色
      } else if (recommendation === "維持現有配置") {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#fff2cc"); // 黃色
      } else {
        sheet.getRange(startRow + 4 + i, 10).setBackground("#f4cccc"); // 紅色
      }
    }
  }
  
  return startRow + 4 + validTimeSlots.length;
}

/**
 * 添加最佳配置建議部分
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorData - 醫師數據
 * @param {Array} clinicData - 診所數據
 * @param {Array} timeSlotData - 時段數據
 * @param {number} startRow - 開始行
 */
function addOptimizationSuggestions(sheet, doctorData, clinicData, timeSlotData, startRow) {
  // 設置段落標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("4. 資源配置最佳化建議").setFontWeight("bold");
  
  // 增加部分說明
  sheet.getRange(`A${startRow+1}:J${startRow+1}`).merge();
  sheet.getRange(`A${startRow+1}`).setValue("基於績效數據，以下提供醫師、診所和時段資源配置的優化建議。");
  
  let currentRow = startRow + 3;
  
  // 醫師資源配置建議
  sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
  sheet.getRange(`A${currentRow}`).setValue("4.1 醫師資源配置建議").setFontWeight("bold");
  currentRow++;
  
  // 找出表現最好和最差的醫師
  const sortedDoctors = doctorData
    .filter(doc => doc.sessions > 0)
    .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  if (sortedDoctors.length > 0) {
    const topDoctors = sortedDoctors.slice(0, Math.min(3, sortedDoctors.length));
    const bottomDoctors = sortedDoctors.slice(-Math.min(3, sortedDoctors.length));
    
    sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
    sheet.getRange(`A${currentRow}`).setValue("最高效益醫師：");
    currentRow++;
    
    topDoctors.forEach(doctor => {
      sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
      sheet.getRange(`A${currentRow}`).setValue(
        `${doctor.name}：每診消耗額 ${doctor.consumptionPerSession.toFixed(2)}，建議增加診次配置`
      );
      currentRow++;
    });
    
    currentRow++;
    sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
    sheet.getRange(`A${currentRow}`).setValue("待提升醫師：");
    currentRow++;
    
    bottomDoctors.forEach(doctor => {
      sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
      sheet.getRange(`A${currentRow}`).setValue(
        `${doctor.name}：每診消耗額 ${doctor.consumptionPerSession.toFixed(2)}，建議強化產品組合或降低診次`
      );
      currentRow++;
    });
  }
  
  currentRow += 2;
  
  // 診所-時段配置建議
  sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
  sheet.getRange(`A${currentRow}`).setValue("4.2 診所-時段最佳配置").setFontWeight("bold");
  currentRow++;
  
  // 分析每個診所的最佳和最差時段
  if (clinicData.length > 0) {
    for (const clinic of clinicData.filter(c => c.sessions > 0).sort((a, b) => b.consumption - a.consumption)) {
      const clinicName = clinic.name;
      
      // 計算該診所各時段的績效
      const timeSlotPerformance = {};
      let bestTimeSlot = null;
      let worstTimeSlot = null;
      let bestPerformance = 0;
      let worstPerformance = Number.MAX_VALUE;
      
      for (const slot of GLOBAL.TIME_SLOTS) {
        // 找出該診所在特定時段的診次數和消耗總額
        let slotSessions = 0;
        let slotConsumption = 0;
        
        for (const row of doctorData) {
          if (row.clinic === clinicName && row.timeSlots[slot] > 0) {
            // 這是一個粗略的估計，實際情況可能更複雜
            const slotRatio = row.timeSlots[slot] / row.sessions;
            slotSessions += row.timeSlots[slot];
            slotConsumption += row.consumption * slotRatio;
          }
        }
        
        const performance = slotSessions > 0 ? slotConsumption / slotSessions : 0;
        timeSlotPerformance[slot] = performance;
        
        if (performance > bestPerformance) {
          bestPerformance = performance;
          bestTimeSlot = slot;
        }
        
        if (performance < worstPerformance && performance > 0) {
          worstPerformance = performance;
          worstTimeSlot = slot;
        }
      }
      
      sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
      sheet.getRange(`A${currentRow}`).setValue(`${clinicName}：`);
      currentRow++;
      
      if (bestTimeSlot) {
        sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
        sheet.getRange(`A${currentRow}`).setValue(
          `  最佳時段：${bestTimeSlot}（每診消耗額 ${bestPerformance.toFixed(2)}），建議增加此時段診次`
        );
        currentRow++;
      }
      
      if (worstTimeSlot) {
        sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
        sheet.getRange(`A${currentRow}`).setValue(
          `  待提升時段：${worstTimeSlot}（每診消耗額 ${worstPerformance.toFixed(2)}），建議調整資源分配`
        );
        currentRow++;
      }
      
      currentRow++;
    }
  }
  
  currentRow += 1;
  
  // 醫師重新分配建議
  sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
  sheet.getRange(`A${currentRow}`).setValue("4.3 醫師跨診所優化建議").setFontWeight("bold");
  currentRow++;
  
  // 簡單的聚類分析：找出表現最好的醫師-診所組合
  sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
  sheet.getRange(`A${currentRow}`).setValue(
    "建議查看「跨診所BCG矩陣」工作表，找出每位醫師在不同診所的表現差異，並考慮以下優化方向："
  );
  currentRow++;
  
  const optimizationSuggestions = [
    "將高效優勢型醫師優先分配至高需求診所",
    "精品專科型醫師配對至專科需求高的診所",
    "高量低效型醫師適合配置於基礎診療為主的診所",
    "績效待提升型醫師需提供培訓或調整專業方向",
    "考慮醫師主要時段效能，與診所最佳時段匹配",
    "定期評估醫師-診所組合效能，進行動態調整"
  ];
  
  for (const suggestion of optimizationSuggestions) {
    sheet.getRange(`A${currentRow}:J${currentRow}`).merge();
    sheet.getRange(`A${currentRow}`).setValue(`• ${suggestion}`);
    currentRow++;
  }
  
  // 美化報告
  sheet.getRange("A1:J1").setFontSize(16);
  sheet.setColumnWidth(1, 200);
  for (let i = 2; i <= 10; i++) {
    sheet.setColumnWidth(i, 120);
  }
}

/**
 * 顯示選擇醫師的UI介面
 */
function showDoctorFilterUI() {
  // 保持原有功能
  // 獲取所有醫師名稱
  const doctors = getAllDoctors();
  
  if (doctors.length === 0) {
    Browser.msgBox("找不到醫師數據，請先運行 AutoRun() 進行數據處理。");
    return;
  }
  
  // 創建自定義對話框
  const htmlOutput = HtmlService
    .createHtmlOutput(createDoctorFilterHtml(doctors))
    .setWidth(400)
    .setHeight(500)
    .setTitle('選擇醫師進行篩選');
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '醫師績效篩選');
}

/**
 * 獲取所有醫師名稱
 */
function getAllDoctors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  const data = sourceSheet.getDataRange().getValues();
  
  // 從第二行開始（跳過標題行）
  const doctors = new Set();
  for (let i = 1; i < data.length; i++) {
    const doctorName = data[i][1]; // B列是醫師名稱
    if (doctorName && doctorName !== "" && doctorName !== "無醫師") {
      doctors.add(doctorName);
    }
  }
  
  return Array.from(doctors).sort();
}

/**
 * 創建醫師篩選的HTML
 */
function createDoctorFilterHtml(doctors) {
  let html = `
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 15px;
      }
      .doctor-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 15px;
      }
      .doctor-item {
        margin-bottom: 8px;
      }
      .button-row {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      button {
        padding: 8px 15px;
        cursor: pointer;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
      }
      button:hover {
        background-color: #3367d6;
      }
      .filter-title {
        font-weight: bold;
        margin-bottom: 10px;
      }
      .filter-options {
        margin-top: 15px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
    </style>
    
    <div class="filter-title">請選擇要篩選的醫師：</div>
    <div class="doctor-list">
  `;
  
  // 添加醫師選項
  doctors.forEach(doctor => {
    html += `
      <div class="doctor-item">
        <input type="checkbox" id="doctor-${doctor}" name="doctors" value="${doctor}">
        <label for="doctor-${doctor}">${doctor}</label>
      </div>
    `;
  });
  
  html += `
    </div>
    
    <div class="filter-options">
      <div class="filter-title">統計分析選項：</div>
      <div>
        <input type="checkbox" id="useIQR" name="useIQR" checked>
        <label for="useIQR">使用四分位距(IQR)處理極端值</label>
      </div>
      <div>
        <input type="checkbox" id="useMedian" name="useMedian" checked>
        <label for="useMedian">使用中位數代替平均值進行分析</label>
      </div>
    </div>
    
    <div class="button-row">
      <button onclick="selectAll()">全選</button>
      <button onclick="deselectAll()">取消全選</button>
      <button onclick="generateReport()">生成報告</button>
    </div>
    
    <script>
      function selectAll() {
        const checkboxes = document.querySelectorAll('input[name="doctors"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = true;
        });
      }
      
      function deselectAll() {
        const checkboxes = document.querySelectorAll('input[name="doctors"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
      }
      
      function generateReport() {
        const selectedDoctors = [];
        const checkboxes = document.querySelectorAll('input[name="doctors"]:checked');
        
        checkboxes.forEach(checkbox => {
          selectedDoctors.push(checkbox.value);
        });
        
        if (selectedDoctors.length === 0) {
          alert('請至少選擇一位醫師');
          return;
        }
        
        const useIQR = document.getElementById('useIQR').checked;
        const useMedian = document.getElementById('useMedian').checked;
        
        google.script.run
          .withSuccessHandler(function() {
            google.script.host.close();
          })
          .withFailureHandler(function(error) {
            alert('發生錯誤: ' + error);
          })
          .generateDoctorComparisonReport(selectedDoctors, useIQR, useMedian);
      }
    </script>
  `;
  
  return html;
}

/**
 * 生成醫師比較報告並創建跨診所BCG矩陣
 * 比較同一位醫師在不同診所的績效
 * @param {Array} selectedDoctors - 選定的醫師
 * @param {boolean} useIQR - 是否使用IQR方法處理極端值
 * @param {boolean} useMedian - 是否使用中位數進行分析
 */
function generateDoctorComparisonReport(selectedDoctors, useIQR = true, useMedian = true) {
  // 確保 selectedDoctors 是有效的數組
  if (!selectedDoctors || !Array.isArray(selectedDoctors)) {
    selectedDoctors = getAllDoctors(); // 如果沒有選擇，則使用所有醫師
    if (!selectedDoctors || selectedDoctors.length === 0) {
      Browser.msgBox("無法獲取醫師列表，請先運行 AutoRun() 進行數據處理。");
      return;
    }
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getActiveSheet();
    let data = sourceSheet.getDataRange().getValues();
    
    // 如果需要處理極端值
    if (useIQR) {
      // 跳過標題行，處理數據
      const headers = data[0];
      let rows = data.slice(1);
      
      // 使用IQR方法處理極端值
      rows = handleOutliersWithIQR(rows, GLOBAL.COLUMN_IDX.TOTAL_PATIENTS);
      rows = handleOutliersWithIQR(rows, GLOBAL.COLUMN_IDX.TOTAL_CONSUMPTION);
      
      // 重組數據
      data = [headers, ...rows];
    }
    
    // 獲取或創建報告工作表
    let reportSheet = ss.getSheetByName("醫師跨診所績效比較");
    if (!reportSheet) {
      reportSheet = ss.insertSheet("醫師跨診所績效比較");
    } else {
      reportSheet.clearContents();
    }
    
    // 設置標題行
    reportSheet.getRange("A1:K1").setValues([["醫師", "診所", "總診次", "總人數", "總銷耗", "每診患者人數", "每診消耗額", "每人消耗額", "主要時段", "BCG分類", "比較備註"]]);
    reportSheet.getRange("A1:K1").setFontWeight("bold").setBackground("#E0E0E0");
    
    // 收集所有診所名稱
    const allClinics = new Set();
    for (let i = 1; i < data.length; i++) {
      const clinic = data[i][0]; // A欄：診所
      if (clinic && clinic !== "") {
        allClinics.add(clinic);
      }
    }
    
    // 按醫師+診所分組處理數據
    const doctorMap = {};
    
    // 首先為每個選定的醫師在每個診所創建空記錄
    selectedDoctors.forEach(doctorName => {
      allClinics.forEach(clinic => {
        const key = `${doctorName}_${clinic}`;
        doctorMap[key] = {
          doctor: doctorName,
          clinic: clinic,
          sessions: 0,
          patients: 0,
          consumption: 0,
          timeSlots: {
            '早診': 0,
            '午診': 0,
            '晚診': 0,
            '未知': 0
          }
        };
      });
    });
    
    // 處理數據，填充實際有數據的記錄
    for (let i = 1; i < data.length; i++) {
      const clinic = data[i][0]; // A欄：診所
      const doctorName = data[i][1]; // B欄：醫師
      
      // 只處理選中的醫師
      if (!selectedDoctors || !selectedDoctors.includes(doctorName)) {
        continue;
      }
      
      const sessions = data[i][2]; // C欄：診次數
      const timeSlot = data[i][3]; // D欄：時段
      const totalPatients = data[i][4]; // E欄：總人數
      const totalConsumption = data[i][9]; // J欄：消耗總額
      
      // 處理特殊值 ("-"或空值)
      const sessionCount = convertToNumber(sessions);
      const patientCount = convertToNumber(totalPatients);
      const consumptionAmount = convertToNumber(totalConsumption);
      
      // 按醫師+診所分組統計數據
      const key = `${doctorName}_${clinic}`;
      
      // 累加該醫師在該診所的數據
      doctorMap[key].sessions += sessionCount;
      doctorMap[key].patients += patientCount;
      doctorMap[key].consumption += consumptionAmount;
      
      // 記錄時段資訊
      const validTimeSlot = GLOBAL.TIME_SLOTS.includes(timeSlot) ? timeSlot : "未知";
      if (sessionCount > 0 && doctorMap[key].timeSlots.hasOwnProperty(validTimeSlot)) {
        doctorMap[key].timeSlots[validTimeSlot] += sessionCount;
      }
    }
    
    // 轉換為數組並計算派生指標
    const doctorClinicData = Object.values(doctorMap).map(record => {
      // 計算各項指標 (考慮特殊情況)
      if (record.sessions > 0) {
        record.patientsPerSession = record.patients / record.sessions;
        record.consumptionPerSession = record.consumption / record.sessions;
      } else {
        record.patientsPerSession = 0;
        record.consumptionPerSession = 0;
      }
      
      if (record.patients > 0) {
        record.consumptionPerPatient = record.consumption / record.patients;
      } else {
        record.consumptionPerPatient = 0;
      }
      
      // 計算主要時段（占比最高的時段）
      let maxSessions = 0;
      let primaryTimeSlot = '';
      
      for (const [slot, count] of Object.entries(record.timeSlots)) {
        if (count > maxSessions) {
          maxSessions = count;
          primaryTimeSlot = slot;
        }
      }
      
      record.primaryTimeSlot = primaryTimeSlot;
      
      return record;
    });
    
    // 為每位醫師計算各指標的中位數/平均值
    const doctorMetrics = {};
    selectedDoctors.forEach(doctor => {
      const doctorRecords = doctorClinicData.filter(record => record.doctor === doctor && record.sessions > 0);
      if (doctorRecords.length === 0) return;
      
      // 根據選項使用中位數或平均值
      if (useMedian) {
        // 使用中位數
        const patientsPerSessionValues = doctorRecords.map(r => r.patientsPerSession).filter(v => v > 0);
        const consumptionPerPatientValues = doctorRecords.map(r => r.consumptionPerPatient).filter(v => v > 0);
        
        doctorMetrics[doctor] = {
          medianPatientsPerSession: calculateMedian(patientsPerSessionValues),
          medianConsumptionPerPatient: calculateMedian(consumptionPerPatientValues)
        };
      } else {
        // 使用平均值
        let totalPatientsPerSession = 0;
        let totalConsumptionPerPatient = 0;
        let validPatientCount = 0;
        let validConsumptionCount = 0;
        
        doctorRecords.forEach(record => {
          if (record.patientsPerSession > 0) {
            totalPatientsPerSession += record.patientsPerSession;
            validPatientCount++;
          }
          
          if (record.consumptionPerPatient > 0) {
            totalConsumptionPerPatient += record.consumptionPerPatient;
            validConsumptionCount++;
          }
        });
        
        doctorMetrics[doctor] = {
          avgPatientsPerSession: validPatientCount > 0 ? totalPatientsPerSession / validPatientCount : 0,
          avgConsumptionPerPatient: validConsumptionCount > 0 ? totalConsumptionPerPatient / validConsumptionCount : 0
        };
      }
    });
    
    // 計算全局中位數/平均值 (用於跨診所BCG矩陣)
    let globalPatientsThreshold, globalConsumptionThreshold;
    
    if (useMedian) {
      // 使用中位數
      const allPatientsPerSession = doctorClinicData
        .filter(record => record.sessions > 0 && record.patientsPerSession > 0)
        .map(record => record.patientsPerSession);
        
      const allConsumptionPerPatient = doctorClinicData
        .filter(record => record.patients > 0 && record.consumptionPerPatient > 0)
        .map(record => record.consumptionPerPatient);
        
      globalPatientsThreshold = calculateMedian(allPatientsPerSession);
      globalConsumptionThreshold = calculateMedian(allConsumptionPerPatient);
    } else {
      // 使用平均值
      let totalGlobalPatientsPerSession = 0;
      let totalGlobalConsumptionPerPatient = 0;
      let validGlobalPatientCount = 0;
      let validGlobalConsumptionCount = 0;
      
      doctorClinicData.forEach(record => {
        if (record.sessions > 0 && record.patientsPerSession > 0) {
          totalGlobalPatientsPerSession += record.patientsPerSession;
          validGlobalPatientCount++;
        }
        
        if (record.patients > 0 && record.consumptionPerPatient > 0) {
          totalGlobalConsumptionPerPatient += record.consumptionPerPatient;
          validGlobalConsumptionCount++;
        }
      });
      
      globalPatientsThreshold = validGlobalPatientCount > 0 ? totalGlobalPatientsPerSession / validGlobalPatientCount : 0;
      globalConsumptionThreshold = validGlobalConsumptionCount > 0 ? totalGlobalConsumptionPerPatient / validGlobalConsumptionCount : 0;
    }
    
    // 根據醫師名稱排序
    doctorClinicData.sort((a, b) => {
      // 先按醫師名稱排序
      if (a.doctor !== b.doctor) {
        return a.doctor.localeCompare(b.doctor);
      }
      // 醫師名稱相同時，按診所排序
      return a.clinic.localeCompare(b.clinic);
    });
    
    // 寫入報告數據
    let rowIndex = 2;
    let currentDoctor = null;
    let doctorStartRow = 2;
    
    doctorClinicData.forEach((record, index) => {
      // 確定 BCG 象限
      let thresholdPatients, thresholdConsumption;
      
      if (useMedian) {
        thresholdPatients = doctorMetrics[record.doctor]?.medianPatientsPerSession || globalPatientsThreshold;
        thresholdConsumption = doctorMetrics[record.doctor]?.medianConsumptionPerPatient || globalConsumptionThreshold;
      } else {
        thresholdPatients = doctorMetrics[record.doctor]?.avgPatientsPerSession || globalPatientsThreshold;
        thresholdConsumption = doctorMetrics[record.doctor]?.avgConsumptionPerPatient || globalConsumptionThreshold;
      }
      
      let bcgCategory = "";
      if (record.patientsPerSession >= thresholdPatients && record.consumptionPerPatient >= thresholdConsumption) {
        bcgCategory = "高效優勢型 (High Performance)"; // 高每診患者數，高每人消耗
      } else if (record.patientsPerSession >= thresholdPatients && record.consumptionPerPatient < thresholdConsumption) {
        bcgCategory = "高量低效型 (High Volume)"; // 高每診患者數，低每人消耗
      } else if (record.patientsPerSession < thresholdPatients && record.consumptionPerPatient >= thresholdConsumption) {
        bcgCategory = "精品專科型 (Premium Specialty)"; // 低每診患者數，高每人消耗
      } else {
        bcgCategory = "績效待提升型 (Improvement Needed)"; // 低每診患者數，低每人消耗
      }
      
      // 計算比較備註
      let compareNote = "";
      if (record.sessions === 0) {
        compareNote = "無診次";
      } else {
        // 計算與醫師平均值/中位數的比較
        let referencePatients, referenceConsumption;
        
        if (useMedian) {
          referencePatients = doctorMetrics[record.doctor].medianPatientsPerSession;
          referenceConsumption = doctorMetrics[record.doctor].medianConsumptionPerPatient;
        } else {
          referencePatients = doctorMetrics[record.doctor].avgPatientsPerSession;
          referenceConsumption = doctorMetrics[record.doctor].avgConsumptionPerPatient;
        }
        
        const pctPatients = referencePatients > 0 ? (record.patientsPerSession / referencePatients - 1) * 100 : 0;
        const pctConsumption = referenceConsumption > 0 ? (record.consumptionPerPatient / referenceConsumption - 1) * 100 : 0;
        
        if (Math.abs(pctPatients) < 5 && Math.abs(pctConsumption) < 5) {
          compareNote = "與平均接近";
        } else {
          compareNote = `患者: ${pctPatients >= 0 ? '+' : ''}${pctPatients.toFixed(1)}%, 消耗: ${pctConsumption >= 0 ? '+' : ''}${pctConsumption.toFixed(1)}%`;
        }
      }
      
      // 寫入資料行
      reportSheet.getRange(rowIndex, 1, 1, 11).setValues([[
        record.doctor,
        record.clinic,
        record.sessions,
        record.patients,
        record.consumption,
        record.patientsPerSession,
        record.consumptionPerSession,
        record.consumptionPerPatient,
        record.primaryTimeSlot || "",
        bcgCategory,
        compareNote
      ]]);
      
      // 設置顏色
      if (bcgCategory === "高效優勢型 (High Performance)") {
        reportSheet.getRange(rowIndex, 10).setBackground("#d9ead3");
      } else if (bcgCategory === "高量低效型 (High Volume)") {
        reportSheet.getRange(rowIndex, 10).setBackground("#fff2cc");
      } else if (bcgCategory === "精品專科型 (Premium Specialty)") {
        reportSheet.getRange(rowIndex, 10).setBackground("#cfe2f3");
      } else {
        reportSheet.getRange(rowIndex, 10).setBackground("#f4cccc");
      }
      
      // 處理醫師分組
      if (currentDoctor !== record.doctor) {
        // 如果是新的醫師，設置分組標題
        if (currentDoctor !== null) {
          // 不是第一個醫師，添加分隔行
          reportSheet.getRange(rowIndex, 1, 1, 11).setBackground("#f3f3f3");
          rowIndex++;
        }
        
        currentDoctor = record.doctor;
        doctorStartRow = rowIndex;
        
        // 醫師中位數/平均值行
        if (index < doctorClinicData.length - 1 && doctorClinicData[index + 1].doctor === currentDoctor) {
          let referencePatients, referenceConsumption;
          let referenceLabel;
          
          if (useMedian) {
            referencePatients = doctorMetrics[record.doctor].medianPatientsPerSession;
            referenceConsumption = doctorMetrics[record.doctor].medianConsumptionPerPatient;
            referenceLabel = "中位數";
          } else {
            referencePatients = doctorMetrics[record.doctor].avgPatientsPerSession;
            referenceConsumption = doctorMetrics[record.doctor].avgConsumptionPerPatient;
            referenceLabel = "平均值";
          }
          
          reportSheet.getRange(rowIndex, 1, 1, 8).setValues([[
            `${record.doctor} ${referenceLabel}`,
            "",
            "",
            "",
            "",
            referencePatients,
            "",
            referenceConsumption
          ]]);
          reportSheet.getRange(rowIndex, 1, 1, 11).setBackground("#eaf6ff");
          reportSheet.getRange(rowIndex, 1, 1, 8).setFontWeight("bold");
          rowIndex++;
        }
      }
      
      rowIndex++;
    });
    
    // 格式化工作表
    reportSheet.autoResizeColumns(1, 11);
    reportSheet.setFrozenRows(1);
    
    // 添加篩選功能
    reportSheet.getRange("A1:K1").createFilter();
    
    // 添加排序功能，按醫師名稱排序
    reportSheet.getRange(2, 1, reportSheet.getLastRow() - 1, 11).sort({column: 1, ascending: true});
    
    // 創建跨診所BCG矩陣
    createEnhancedCrossClinicBCGMatrix(ss, doctorClinicData, globalPatientsThreshold, globalConsumptionThreshold, useMedian);
    
    Browser.msgBox(`醫師跨診所績效比較報告與跨診所BCG矩陣已生成！\n使用${useMedian ? '中位數' : '平均值'}分析，${useIQR ? '已' : '未'}處理極端值。`);
    
  } catch (error) {
    Logger.log("生成醫師比較報告時發生錯誤: " + error);
    Browser.msgBox("生成醫師比較報告時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 創建增強版跨診所BCG矩陣
 * 使用中位數或平均值作為分界線
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - 試算表
 * @param {Array} doctorClinicData - 醫師-診所數據
 * @param {number} globalPatientsThreshold - 全局患者數閾值
 * @param {number} globalConsumptionThreshold - 全局消耗額閾值
 * @param {boolean} useMedian - 是否使用中位數
 */
function createEnhancedCrossClinicBCGMatrix(spreadsheet, doctorClinicData, globalPatientsThreshold, globalConsumptionThreshold, useMedian = true) {
  try {
    // 創建新的BCG矩陣工作表或清空已存在的工作表
    var bcgSheet = spreadsheet.getSheetByName("跨診所BCG矩陣");
    if (!bcgSheet) {
      bcgSheet = spreadsheet.insertSheet("跨診所BCG矩陣");
    } else {
      bcgSheet.clear();
    }
    
    // 設置BCG矩陣布局
    setupEnhancedBCGMatrixLayout(
      bcgSheet, 
      "跨診所BCG矩陣 - 醫師與診所整體績效比較", 
      "每診患者人數", 
      "每人消耗額", 
      globalPatientsThreshold, 
      globalConsumptionThreshold,
      useMedian
    );
    
    // 過濾有效數據(至少有一個診次的記錄)
    var validData = doctorClinicData.filter(record => record.sessions > 0);
    
    // 繪製數據點
    plotEnhancedBCGData(bcgSheet, validData, globalPatientsThreshold, globalConsumptionThreshold);
    
    // 添加圖例
    addEnhancedBCGLegend(bcgSheet, useMedian);
    
    // 添加聚類分析
    addClusterAnalysis(bcgSheet, validData, useMedian);
    
    return bcgSheet;
  } catch (error) {
    Logger.log("創建增強版跨診所BCG矩陣時發生錯誤: " + error);
    Browser.msgBox("創建增強版跨診所BCG矩陣時發生錯誤: " + error + "\n" + error.stack);
    return null;
  }
}

/**
 * 設置增強版BCG矩陣布局
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} title - 標題
 * @param {string} yAxisTitle - Y軸標題
 * @param {string} xAxisTitle - X軸標題
 * @param {number} thresholdYValue - Y軸閾值
 * @param {number} thresholdXValue - X軸閾值
 * @param {boolean} useMedian - 是否使用中位數
 */
function setupEnhancedBCGMatrixLayout(sheet, title, yAxisTitle, xAxisTitle, thresholdYValue, thresholdXValue, useMedian) {
  // 設置列寬和行高 - 確保完全一致的大小
  sheet.setColumnWidth(1, 150);
  // 設置B-U列(2-21)的寬度完全相同
  const standardColumnWidth = 30;
  for (var i = 2; i <= 21; i++) {
    sheet.setColumnWidth(i, standardColumnWidth);
  }
  // 設置1-20行的高度完全相同
  const standardRowHeight = 25;
  for (var i = 1; i <= 20; i++) {
    sheet.setRowHeight(i, standardRowHeight);
  }
  
  // 設置標題
  sheet.getRange("A1:U1").merge();
  sheet.getRange("A1").setValue(title).setFontWeight("bold").setHorizontalAlignment("center");
  
  // 繪製象限線
  var quadrantRange = sheet.getRange("B2:U21");
  quadrantRange.setBorder(true, true, true, true, true, true);
  
  // 垂直分隔線（中線）
  var verticalLine = sheet.getRange("L2:L21");
  verticalLine.setBorder(null, true, null, true, null, null, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // 水平分隔線（中線）
  var horizontalLine = sheet.getRange("B11:U11");
  horizontalLine.setBorder(true, null, true, null, null, null, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // 添加象限標籤
  sheet.getRange("Q4").setValue("高效優勢型 (High Performance)").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("F4").setValue("高量低效型 (High Volume)").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("Q16").setValue("精品專科型 (Premium Specialty)").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("F16").setValue("績效待提升型 (Improvement Needed)").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加坐標軸標籤
  sheet.getRange("L22").setValue(xAxisTitle).setFontWeight("bold").setHorizontalAlignment("center");
  sheet.getRange("A11").setValue(yAxisTitle).setFontWeight("bold").setVerticalAlignment("middle");
  
  // 為象限輕微著色
  sheet.getRange("B2:K10").setBackground("#fff2cc");  // 高量低效型 (黃色)
  sheet.getRange("M2:U10").setBackground("#d9ead3");  // 高效優勢型 (綠色)
  sheet.getRange("B12:K21").setBackground("#f4cccc"); // 績效待提升型 (紅色)
  sheet.getRange("M12:U21").setBackground("#cfe2f3"); // 精品專科型 (藍色)
  
  // 添加高/低軸標籤
  sheet.getRange("B22").setValue("低").setFontStyle("italic");
  sheet.getRange("U22").setValue("高").setFontStyle("italic");
  sheet.getRange("A2").setValue("高").setFontStyle("italic");
  sheet.getRange("A21").setValue("低").setFontStyle("italic");
  
  // 添加中位數/平均值參考
  const referenceType = useMedian ? "中位數" : "平均值";
  sheet.getRange("W3").setValue(`全局${referenceType}參考線：`).setFontWeight("bold");
  sheet.getRange("W4").setValue(`${yAxisTitle} ${referenceType}:`);
  sheet.getRange("W5").setValue(`${xAxisTitle} ${referenceType}:`);
  sheet.getRange("X4").setValue(thresholdYValue);
  sheet.getRange("X5").setValue(thresholdXValue);
}

/**
 * 在增強版BCG矩陣上繪製數據點
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} data - 要繪製的數據
 * @param {number} thresholdYValue - Y軸閾值
 * @param {number} thresholdXValue - X軸閾值
 */
function plotEnhancedBCGData(sheet, data, thresholdYValue, thresholdXValue) {
  try {
  // 在工作表底部創建數據表
  var headerRow = sheet.getRange("A24:J24");
  headerRow.setValues([["醫師-診所組合", "診所", "醫師", "每診患者人數", "每人消耗額", "總銷耗", "總診次", "總人數", "主要時段", "BCG分類"]]);
  headerRow.setFontWeight("bold");
  
  // 獲取最大和最小值，用於正確定位點
  var allConsumptionPerPatient = data.map(d => d.consumptionPerPatient).filter(v => v > 0);
  var allPatientsPerSession = data.map(d => d.patientsPerSession).filter(v => v > 0);
  
  var maxConsumption = Math.max(...allConsumptionPerPatient, thresholdXValue * 2);
  var minConsumption = Math.min(...allConsumptionPerPatient, 0);
  var maxPatients = Math.max(...allPatientsPerSession, thresholdYValue * 2);
  var minPatients = Math.min(...allPatientsPerSession, 0);
  
  // 獲取總消耗的最大和最小值，用於氣泡大小
  var allConsumptions = data.map(d => d.consumption).filter(v => v > 0);
  var minTotalConsumption = Math.min(...allConsumptions);
  var maxTotalConsumption = Math.max(...allConsumptions);
  
  // 將數據添加到表格並繪製在矩陣上
  for (var i = 0; i < data.length; i++) {
    // 只處理有診次的醫師-診所組合
    if (data[i].sessions <= 0) continue;
    
    var doctor = data[i].doctor;
    var clinic = data[i].clinic;
    var patientsPerSession = data[i].patientsPerSession;
    var consumptionPerPatient = data[i].consumptionPerPatient;
    var totalConsumption = data[i].consumption;
    var primaryTimeSlot = data[i].primaryTimeSlot || "";
    
    // 判斷象限
    var isHighPatients = patientsPerSession >= thresholdYValue;
    var isHighConsumption = consumptionPerPatient >= thresholdXValue;
    
    var bcgCategory = "";
    if (isHighPatients && isHighConsumption) {
      bcgCategory = "高效優勢型 (High Performance)";
    } else if (isHighPatients && !isHighConsumption) {
      bcgCategory = "高量低效型 (High Volume)";
    } else if (!isHighPatients && isHighConsumption) {
      bcgCategory = "精品專科型 (Premium Specialty)";
    } else {
      bcgCategory = "績效待提升型 (Improvement Needed)";
    }
    
    // 添加到數據表
    sheet.getRange(25 + i, 1, 1, 10).setValues([[
      doctor + " @ " + clinic,
      clinic,
      doctor,
      patientsPerSession,
      consumptionPerPatient,
      totalConsumption,
      data[i].sessions,
      data[i].patients,
      primaryTimeSlot,
      bcgCategory
    ]]);
    
    // 根據BCG類別設置顏色
    if (bcgCategory === "高效優勢型 (High Performance)") {
      sheet.getRange(25 + i, 10).setBackground("#d9ead3");
    } else if (bcgCategory === "高量低效型 (High Volume)") {
      sheet.getRange(25 + i, 10).setBackground("#fff2cc");
    } else if (bcgCategory === "精品專科型 (Premium Specialty)") {
      sheet.getRange(25 + i, 10).setBackground("#cfe2f3");
    } else {
      sheet.getRange(25 + i, 10).setBackground("#f4cccc");
    }
    
    // 直接計算象限位置
    var colStart, rowStart;
    
    if (isHighConsumption) {
      colStart = 13; // 右半區 (M-U)
    } else {
      colStart = 2;  // 左半區 (B-K)
    }
    
    if (isHighPatients) {
      rowStart = 2;  // 上半區 (2-10)
    } else {
      rowStart = 12; // 下半區 (12-21)
    }
    
    // 計算在象限內的相對位置
    var colOffset, rowOffset;
    
    if (isHighConsumption) {
      var range = maxConsumption - thresholdXValue;
      if (range > 0) {
        var relativePosition = (consumptionPerPatient - thresholdXValue) / range;
        colOffset = Math.floor(relativePosition * 8);
        colOffset = Math.min(8, Math.max(0, colOffset));
      } else {
        colOffset = 4;
      }
    } else {
      var range = thresholdXValue - minConsumption;
      if (range > 0) {
        var relativePosition = (thresholdXValue - consumptionPerPatient) / range;
        colOffset = 8 - Math.floor(relativePosition * 8);
        colOffset = Math.min(8, Math.max(0, colOffset));
      } else {
        colOffset = 4;
      }
    }
    
    if (isHighPatients) {
      var range = maxPatients - thresholdYValue;
      if (range > 0) {
        var relativePosition = (patientsPerSession - thresholdYValue) / range;
        rowOffset = Math.floor(relativePosition * 8);
        rowOffset = Math.min(8, Math.max(0, rowOffset));
      } else {
        rowOffset = 4;
      }
    } else {
      var range = thresholdYValue - minPatients;
      if (range > 0) {
        var relativePosition = (thresholdYValue - patientsPerSession) / range;
        rowOffset = 8 - Math.floor(relativePosition * 8);
        rowOffset = Math.min(8, Math.max(0, rowOffset));
      } else {
        rowOffset = 4;
      }
    }
    
    // 特殊情況處理
    if (patientsPerSession === 0) {
      rowOffset = 8;
    }
    
    if (consumptionPerPatient === 0) {
      colOffset = 0;
    }
    
    // 最終位置
    var col = colStart + colOffset;
    var row = rowStart + rowOffset;
    
    // 確保列和行在範圍內
    col = Math.max(2, Math.min(21, col));
    row = Math.max(2, Math.min(21, row));
    
    // 計算氣泡大小（根據總銷耗的相對大小）
    var normalizedConsumption = 0;
    if (maxTotalConsumption > minTotalConsumption) {
      normalizedConsumption = (totalConsumption - minTotalConsumption) / (maxTotalConsumption - minTotalConsumption);
    }
    
    // 使用固定的字體大小，以確保所有醫師和診所名稱的字體一致
    var fontSize = 10;
    
    // 繪製氣泡
    var cell = sheet.getRange(row, col);
    cell.setValue(doctor + "\n" + clinic);
    
    // 根據主要時段添加特殊標記
    let displayText = doctor + "\n" + clinic;
    if (primaryTimeSlot) {
      displayText += "\n[" + primaryTimeSlot + "]";
    }
    cell.setValue(displayText);
    
    // 根據象限設置氣泡樣式
    if (isHighConsumption) {
      if (isHighPatients) {
        // 右上: 高效優勢型
        cell.setBackground("#93C47D").setFontColor("#000000");
      } else {
        // 右下: 精品專科型
        cell.setBackground("#9FC5E8").setFontColor("#000000");
      }
    } else {
      if (isHighPatients) {
        // 左上: 高量低效型
        cell.setBackground("#FFD966").setFontColor("#000000");
      } else {
        // 左下: 績效待提升型
        cell.setBackground("#EA9999").setFontColor("#000000");
      }
    }
    
    // 設置統一的字體大小和對齊方式
    cell.setFontSize(fontSize);
    cell.setHorizontalAlignment("center");
    cell.setVerticalAlignment("middle");
    
    // 添加註釋以顯示浮動資訊
    var tooltipContent = 
      "醫師: " + doctor + "\n" +
      "診所: " + clinic + "\n" +
      "每診患者數: " + patientsPerSession.toFixed(2) + "\n" +
      "每人消耗額: " + consumptionPerPatient.toFixed(2) + "\n" +
      "總銷耗: " + totalConsumption.toLocaleString() + "\n" +
      "總診次: " + data[i].sessions + "\n" +
      "總人數: " + data[i].patients + "\n" +
      "主要時段: " + primaryTimeSlot + "\n" +
      "BCG分類: " + bcgCategory + "\n" +
      "建議: " + (bcgCategory === "高效優勢型 (High Performance)" ? "維持現狀，可考慮增加診次，發揮規模效益" :
                 bcgCategory === "高量低效型 (High Volume)" ? "提升產品組合或服務價值，增加患者單次消費" :
                 bcgCategory === "精品專科型 (Premium Specialty)" ? "增加行銷力度，擴大患者基礎，提高診所使用率" :
                 "檢討診所配置及產品組合，考慮調整或轉型");
    
    cell.setNote(tooltipContent);
  }
  
  // 設置固定欄寬，不使用自動調整
  for (let i = 0; i < 10; i++) {
    sheet.setColumnWidth(i + 1, i === 0 ? 150 : 120);
  }
  } catch (error) {
    Logger.log("在plotEnhancedBCGData函數中發生錯誤: " + error);
    Browser.msgBox("在plotEnhancedBCGData函數中發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 為增強版BCG矩陣添加圖例
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {boolean} useMedian - 是否使用中位數分析
 */
function addEnhancedBCGLegend(sheet, useMedian) {
  var legendRange = sheet.getRange("W7:AB16");
  legendRange.setBorder(true, true, true, true, true, true);
  
  sheet.getRange("W7:AB7").merge().setValue("跨診所BCG矩陣圖例").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 象限描述
  sheet.getRange("W9:AB9").merge().setValue("象限描述：").setFontWeight("bold");
  
  sheet.getRange("W10").setBackground("#d9ead3");
  sheet.getRange("X10:AB10").merge().setValue("高效優勢型：高每診患者人數、高每人消耗額");
  
  sheet.getRange("W11").setBackground("#fff2cc");
  sheet.getRange("X11:AB11").merge().setValue("高量低效型：高每診患者人數、低每人消耗額");
  
  sheet.getRange("W12").setBackground("#cfe2f3");
  sheet.getRange("X12:AB12").merge().setValue("精品專科型：低每診患者人數、高每人消耗額");
  
  sheet.getRange("W13").setBackground("#f4cccc");
  sheet.getRange("X13:AB13").merge().setValue("績效待提升型：低每診患者人數、低每人消耗額");
  
  // 分析方法說明
  sheet.getRange("W15:AB15").merge().setValue("分析方法：").setFontWeight("bold");
  sheet.getRange("W16:AB16").merge().setValue(`使用${useMedian ? '中位數' : '平均值'}分析，[時段]表示主要診次時段`);
}

/**
 * 添加聚類分析
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} data - 醫師-診所數據
 * @param {boolean} useMedian - 是否使用中位數
 */
function addClusterAnalysis(sheet, data, useMedian) {
  // 添加聚類分析區域
  var clusterRange = sheet.getRange("W18:AB30");
  clusterRange.setBorder(true, true, true, true, true, true);
  
  sheet.getRange("W18:AB18").merge().setValue("醫師-診所聚類分析").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 基本效能聚類 - 按每診消耗額分組
  sheet.getRange("W20:AB20").merge().setValue("效能分組（按每診消耗額）：").setFontWeight("bold");
  
  // 過濾有效數據
  const validData = data.filter(record => record.sessions > 0 && record.consumptionPerSession > 0);
  
  // 按每診消耗額排序
  const sortedByEfficiency = [...validData].sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  // 只顯示排名前三和後三
  const topThree = sortedByEfficiency.slice(0, Math.min(3, sortedByEfficiency.length));
  const bottomThree = sortedByEfficiency.slice(-Math.min(3, sortedByEfficiency.length));
  
  // 添加最高效能組
  sheet.getRange("W21").setValue("最高效能：");
  let row = 21;
  topThree.forEach((record, index) => {
    sheet.getRange(`X${row + index}:AB${row + index}`).merge().setValue(
      `${record.doctor} @ ${record.clinic}: ${record.consumptionPerSession.toFixed(2)}/診`
    );
  });
  
  // 添加最低效能組
  row = 21 + topThree.length + 1;
  sheet.getRange(`W${row}`).setValue("待提升效能：");
  bottomThree.forEach((record, index) => {
    sheet.getRange(`X${row + index}:AB${row + index}`).merge().setValue(
      `${record.doctor} @ ${record.clinic}: ${record.consumptionPerSession.toFixed(2)}/診`
    );
  });
  
  // 添加診所聚類
  row = row + bottomThree.length + 2;
  sheet.getRange(`W${row}:AB${row}`).merge().setValue("診所分群（績效相似度）：").setFontWeight("bold");
  
  // 獲取所有診所
  const allClinics = [...new Set(validData.map(record => record.clinic))];
  
  // 按診所分組計算平均值
  const clinicPerformance = {};
  allClinics.forEach(clinic => {
    const clinicRecords = validData.filter(record => record.clinic === clinic);
    const totalConsumptionPerSession = clinicRecords.reduce((sum, record) => sum + record.consumptionPerSession, 0);
    const avgConsumptionPerSession = totalConsumptionPerSession / clinicRecords.length;
    
    clinicPerformance[clinic] = {
      avgConsumptionPerSession,
      count: clinicRecords.length
    };
  });
  
  // 簡單分群（高/中/低效能）
  const clinicPerformanceArray = Object.entries(clinicPerformance);
  const sortedClinics = clinicPerformanceArray.sort((a, b) => b[1].avgConsumptionPerSession - a[1].avgConsumptionPerSession);
  
  const clinicCount = sortedClinics.length;
  const highPerformanceClinics = sortedClinics.slice(0, Math.ceil(clinicCount / 3));
  const mediumPerformanceClinics = sortedClinics.slice(Math.ceil(clinicCount / 3), Math.ceil(2 * clinicCount / 3));
  const lowPerformanceClinics = sortedClinics.slice(Math.ceil(2 * clinicCount / 3));
  
  // 添加診所分群
  row++;
  if (highPerformanceClinics.length > 0) {
    sheet.getRange(`W${row}`).setValue("高效能診所：");
    sheet.getRange(`X${row}:AB${row}`).merge().setValue(
      highPerformanceClinics.map(c => c[0]).join(", ")
    );
    row++;
  }
  
  if (mediumPerformanceClinics.length > 0) {
    sheet.getRange(`W${row}`).setValue("中效能診所：");
    sheet.getRange(`X${row}:AB${row}`).merge().setValue(
      mediumPerformanceClinics.map(c => c[0]).join(", ")
    );
    row++;
  }
  
  if (lowPerformanceClinics.length > 0) {
    sheet.getRange(`W${row}`).setValue("低效能診所：");
    sheet.getRange(`X${row}:AB${row}`).merge().setValue(
      lowPerformanceClinics.map(c => c[0]).join(", ")
    );
    row++;
  }
}

/**
 * 刪除空行
 */
function deleteBlankRows() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // 存儲要刪除的行（從下到上）
    const blankRows = [];
    
    for (let i = lastRow; i >= 1; i--) {
      const rowRange = sheet.getRange(i, 1, 1, sheet.getLastColumn());
      const rowValues = rowRange.getValues()[0];
      
      // 檢查該行的所有單元格是否都為空
      const isBlank = rowValues.every(cell => cell === '');
      
      if (isBlank) {
        blankRows.push(i);
      }
    }
    
    // 刪除識別出的空行
    blankRows.forEach(row => sheet.deleteRow(row));
    
    // 顯示完成消息
    const msg = blankRows.length > 0 
      ? `已刪除 ${blankRows.length} 個空行。` 
      : "未發現空行。";
    Browser.msgBox(msg);
  } catch (error) {
    Logger.log("刪除空行時發生錯誤: " + error);
    Browser.msgBox("刪除空行時發生錯誤: " + error);
  }
}

/**
 * 創建所有分析報表
 */
function createAllAnalysisReports() {
  try {
    // 先處理數據
    const {
      doctorData, 
      clinicData, 
      timeSlotData,
      doctorClinicData,
      doctorTimeSlotData,
      clinicTimeSlotData
    } = processEnhancedDoctorData(true);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 創建績效分析報表
    createPerformanceAnalysisReport(ss, doctorData, clinicData, timeSlotData);
    
    // 創建時段分析報表
    createTimeSlotAnalysisReport(ss, timeSlotData, doctorTimeSlotData, clinicTimeSlotData);
    
    // 創建聚類分析報表
    createClusterAnalysisReport(ss, doctorData, clinicData, doctorClinicData);
    
    // 創建最佳配置建議報表
    createOptimizationSuggestionsReport(ss, doctorData, clinicData, timeSlotData, doctorClinicData);
    
  } catch (error) {
    Logger.log("創建分析報表時發生錯誤: " + error);
    Browser.msgBox("創建分析報表時發生錯誤: " + error + "\n" + error.stack);
  }
}

/**
 * 創建績效分析報表
 * @param {SpreadsheetApp.Spreadsheet} ss - 試算表
 * @param {Array} doctorData - 醫師數據
 * @param {Array} clinicData - 診所數據
 * @param {Array} timeSlotData - 時段數據
 */
function createPerformanceAnalysisReport(ss, doctorData, clinicData, timeSlotData) {
  // 創建績效分析工作表
  let reportSheet = ss.getSheetByName("績效分析報表");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("績效分析報表");
  } else {
    reportSheet.clear();
  }
  
  // 設置標題
  reportSheet.getRange("A1:J1").merge();
  reportSheet.getRange("A1").setValue("醫療診所績效綜合分析報表").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加說明
  reportSheet.getRange("A2:J2").merge();
  reportSheet.getRange("A2").setValue("本報表使用四分位距(IQR)處理極端值，採用中位數分析降低離群值影響。");
  
  // 添加醫師績效表
  addPerformanceTable(reportSheet, "醫師績效排名", doctorData, 4, 
                    ["醫師", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "主要時段", "BCG分類", "績效指數"]);
  
  // 添加診所績效表
  const doctorRowCount = Math.min(doctorData.length, 10) + 7; // 限制顯示前10名
  addPerformanceTable(reportSheet, "診所績效排名", clinicData, doctorRowCount, 
                    ["診所", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "主要時段", "BCG分類", "市場份額"]);
  
  // 添加時段績效表
  const clinicRowCount = doctorRowCount + Math.min(clinicData.length, 10) + 7; // 限制顯示前10名
  addPerformanceTable(reportSheet, "時段績效比較", timeSlotData, clinicRowCount, 
                    ["時段", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "診次占比", "BCG分類", "建議"]);
  
  // 設置樣式
  formatReportSheet(reportSheet);
}

/**
 * 添加績效表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} title - 表格標題
 * @param {Array} data - 數據
 * @param {number} startRow - 起始行
 * @param {Array} headers - 表頭
 * @return {number} 下一個可用行
 */
function addPerformanceTable(sheet, title, data, startRow, headers) {
  // 添加表格標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue(title).setFontWeight("bold");
  startRow++;
  
  // 添加表頭
  sheet.getRange(`A${startRow}:J${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 根據情況處理數據
  let processedData;
  
  if (title === "醫師績效排名") {
    // 按總消耗額排序，並計算績效指數
    processedData = [...data]
      .filter(d => d.sessions > 0)
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10) // 只取前10名
      .map(d => {
        // 確定BCG分類
        let bcgCategory;
        const medianPatients = calculateMedian(data.filter(doc => doc.sessions > 0).map(doc => doc.patientsPerSession));
        const medianConsumption = calculateMedian(data.filter(doc => doc.sessions > 0).map(doc => doc.consumptionPerPatient));
        
        if (d.patientsPerSession >= medianPatients && d.consumptionPerPatient >= medianConsumption) {
          bcgCategory = "高效優勢型";
        } else if (d.patientsPerSession >= medianPatients) {
          bcgCategory = "高量低效型";
        } else if (d.consumptionPerPatient >= medianConsumption) {
          bcgCategory = "精品專科型";
        } else {
          bcgCategory = "績效待提升型";
        }
        
        // 計算績效指數 (加權綜合得分)
        const efficiencyScore = (d.patientsPerSession / medianPatients) * 50 + (d.consumptionPerPatient / medianConsumption) * 50;
        
        return [
          d.name,
          d.sessions,
          d.patients,
          d.consumption,
          d.patientsPerSession.toFixed(2),
          d.consumptionPerSession.toFixed(2),
          d.consumptionPerPatient.toFixed(2),
          d.primaryTimeSlot || "",
          bcgCategory,
          efficiencyScore.toFixed(2)
        ];
      });
  } else if (title === "診所績效排名") {
    // 按總消耗額排序，並計算市場份額
    const totalMarket = data.reduce((sum, c) => sum + c.consumption, 0);
    
    processedData = [...data]
      .filter(d => d.sessions > 0)
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10) // 只取前10名
      .map(d => {
        // 確定BCG分類
        let bcgCategory;
        const medianPatients = calculateMedian(data.filter(c => c.sessions > 0).map(c => c.patientsPerSession));
        const medianConsumption = calculateMedian(data.filter(c => c.sessions > 0).map(c => c.consumptionPerPatient));
        
        if (d.patientsPerSession >= medianPatients && d.consumptionPerPatient >= medianConsumption) {
          bcgCategory = "高效優勢型";
        } else if (d.patientsPerSession >= medianPatients) {
          bcgCategory = "高量低效型";
        } else if (d.consumptionPerPatient >= medianConsumption) {
          bcgCategory = "精品專科型";
        } else {
          bcgCategory = "績效待提升型";
        }
        
        // 計算市場份額
        const marketShare = (d.consumption / totalMarket * 100).toFixed(2) + "%";
        
        return [
          d.name,
          d.sessions,
          d.patients,
          d.consumption,
          d.patientsPerSession.toFixed(2),
          d.consumptionPerSession.toFixed(2),
          d.consumptionPerPatient.toFixed(2),
          d.primaryTimeSlot || "",
          bcgCategory,
          marketShare
        ];
      });
  } else if (title === "時段績效比較") {
    // 按每診消耗額排序
    processedData = [...data]
      .filter(d => d.sessions > 0)
      .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession)
      .map(d => {
        // 確定BCG分類
        let bcgCategory;
        const medianPatients = calculateMedian(data.filter(t => t.sessions > 0).map(t => t.patientsPerSession));
        const medianConsumption = calculateMedian(data.filter(t => t.sessions > 0).map(t => t.consumptionPerPatient));
        
        if (d.patientsPerSession >= medianPatients && d.consumptionPerPatient >= medianConsumption) {
          bcgCategory = "高效優勢型";
        } else if (d.patientsPerSession >= medianPatients) {
          bcgCategory = "高量低效型";
        } else if (d.consumptionPerPatient >= medianConsumption) {
          bcgCategory = "精品專科型";
        } else {
          bcgCategory = "績效待提升型";
        }
        
        // 計算診次占比
        const totalSessions = data.reduce((sum, t) => sum + t.sessions, 0);
        const sessionPercentage = (d.sessions / totalSessions * 100).toFixed(2) + "%";
        
        // 生成建議
        let recommendation;
        const medianEfficiency = calculateMedian(data.filter(t => t.sessions > 0).map(t => t.consumptionPerSession));
        
        if (d.consumptionPerSession >= medianEfficiency * 1.2) {
          recommendation = "增加診次配置";
        } else if (d.consumptionPerSession <= medianEfficiency * 0.8) {
          recommendation = "減少診次配置";
        } else {
          recommendation = "維持現有配置";
        }
        
        return [
          d.name,
          d.sessions,
          d.patients,
          d.consumption,
          d.patientsPerSession.toFixed(2),
          d.consumptionPerSession.toFixed(2),
          d.consumptionPerPatient.toFixed(2),
          sessionPercentage,
          bcgCategory,
          recommendation
        ];
      });
  }
  
  // 寫入數據
  if (processedData && processedData.length > 0) {
    sheet.getRange(startRow, 1, processedData.length, 10).setValues(processedData);
    
    // 設置BCG分類顏色
    for (let i = 0; i < processedData.length; i++) {
      const bcgCategory = processedData[i][8];
      if (bcgCategory === "高效優勢型") {
        sheet.getRange(startRow + i, 9).setBackground("#d9ead3");
      } else if (bcgCategory === "高量低效型") {
        sheet.getRange(startRow + i, 9).setBackground("#fff2cc");
      } else if (bcgCategory === "精品專科型") {
        sheet.getRange(startRow + i, 9).setBackground("#cfe2f3");
      } else {
        sheet.getRange(startRow + i, 9).setBackground("#f4cccc");
      }
    }
    
    // 設置最後一列顏色
    if (title === "時段績效比較") {
      for (let i = 0; i < processedData.length; i++) {
        const recommendation = processedData[i][9];
        if (recommendation === "增加診次配置") {
          sheet.getRange(startRow + i, 10).setBackground("#d9ead3");
        } else if (recommendation === "維持現有配置") {
          sheet.getRange(startRow + i, 10).setBackground("#fff2cc");
        } else {
          sheet.getRange(startRow + i, 10).setBackground("#f4cccc");
        }
      }
    }
    
    startRow += processedData.length;
  }
  
  return startRow + 2; // 返回下一個可用行，並添加2行間距
}

/**
 * 格式化報告工作表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 */
function formatReportSheet(sheet) {
  // 設置標題字體
  sheet.getRange("A1").setFontSize(16);
  
  // 設置列寬
  sheet.setColumnWidth(1, 150);
  for (let i = 2; i <= 10; i++) {
    sheet.setColumnWidth(i, 100);
  }
  
  // 凍結頂部行
  sheet.setFrozenRows(1);
}

/**
 * 創建時段分析報表
 * @param {SpreadsheetApp.Spreadsheet} ss - 試算表
 * @param {Array} timeSlotData - 時段數據
 * @param {Array} doctorTimeSlotData - 醫師-時段數據
 * @param {Array} clinicTimeSlotData - 診所-時段數據
 */
function createTimeSlotAnalysisReport(ss, timeSlotData, doctorTimeSlotData, clinicTimeSlotData) {
  // 創建時段分析工作表
  let reportSheet = ss.getSheetByName("時段分析報表");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("時段分析報表");
  } else {
    reportSheet.clear();
  }
  
  // 設置標題
  reportSheet.getRange("A1:J1").merge();
  reportSheet.getRange("A1").setValue("醫療診所時段效能分析報表").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加說明
  reportSheet.getRange("A2:J2").merge();
  reportSheet.getRange("A2").setValue("本報表分析不同時段(早診/午診/晚診)的績效指標，並提供醫師和診所在各時段的表現分析。");
  
  // 添加時段總體比較
  addTimeSlotComparisonTable(reportSheet, timeSlotData, 4);
  
  // 添加最佳時段醫師表
  addBestTimeSlotDoctorsTable(reportSheet, doctorTimeSlotData, 12);
  
  // 添加最佳時段診所表
  addBestTimeSlotClinicsTable(reportSheet, clinicTimeSlotData, 24);
  
  // 添加時段優化建議
  addTimeSlotOptimizationSuggestions(reportSheet, timeSlotData, doctorTimeSlotData, clinicTimeSlotData, 36);
  
  // 設置樣式
  formatReportSheet(reportSheet);
}

/**
 * 添加時段比較表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} timeSlotData - 時段數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addTimeSlotComparisonTable(sheet, timeSlotData, startRow) {
  // 添加表格標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("1. 時段整體效能比較").setFontWeight("bold");
  startRow++;
  
  // 準備表頭
  const headers = ["時段", "總診次", "總人數", "總消耗額", "每診患者數", "每診消耗額", "每人消耗額", "診次占比", "效能指數", "建議"];
  sheet.getRange(`A${startRow}:J${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 過濾有效數據
  const validTimeSlots = timeSlotData.filter(ts => GLOBAL.TIME_SLOTS.includes(ts.name) && ts.sessions > 0);
  
  // 計算總診次
  const totalSessions = validTimeSlots.reduce((sum, ts) => sum + ts.sessions, 0);
  
  // 計算效能指標的中位數，用於比較
  const medianConsumptionPerSession = calculateMedian(validTimeSlots.map(ts => ts.consumptionPerSession));
  
  // 按每診消耗額排序
  const sortedTimeSlots = [...validTimeSlots].sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  // 準備數據行
  const timeSlotRows = sortedTimeSlots.map(timeSlot => {
    // 計算診次占比
    const sessionPercentage = (timeSlot.sessions / totalSessions * 100).toFixed(2) + "%";
    
    // 計算效能指數 (相對於中位數)
    const efficiencyIndex = (timeSlot.consumptionPerSession / medianConsumptionPerSession * 100).toFixed(2);
    
    // 生成建議
    let recommendation;
    if (timeSlot.consumptionPerSession >= medianConsumptionPerSession * 1.2) {
      recommendation = "增加診次配置";
    } else if (timeSlot.consumptionPerSession <= medianConsumptionPerSession * 0.8) {
      recommendation = "減少診次配置";
    } else {
      recommendation = "維持現有配置";
    }
    
    return [
      timeSlot.name,
      timeSlot.sessions,
      timeSlot.patients,
      timeSlot.consumption,
      timeSlot.patientsPerSession.toFixed(2),
      timeSlot.consumptionPerSession.toFixed(2),
      timeSlot.consumptionPerPatient.toFixed(2),
      sessionPercentage,
      efficiencyIndex,
      recommendation
    ];
  });
  
  // 寫入數據
  sheet.getRange(startRow, 1, timeSlotRows.length, 10).setValues(timeSlotRows);
  
  // 設置效能指數和建議的顏色
  for (let i = 0; i < timeSlotRows.length; i++) {
    const efficiencyIndex = parseFloat(timeSlotRows[i][8]);
    const recommendation = timeSlotRows[i][9];
    
    // 效能指數顏色
    if (efficiencyIndex >= 120) {
      sheet.getRange(startRow + i, 9).setBackground("#d9ead3"); // 綠色
    } else if (efficiencyIndex >= 80) {
      sheet.getRange(startRow + i, 9).setBackground("#fff2cc"); // 黃色
    } else {
      sheet.getRange(startRow + i, 9).setBackground("#f4cccc"); // 紅色
    }
    
    // 建議顏色
    if (recommendation === "增加診次配置") {
      sheet.getRange(startRow + i, 10).setBackground("#d9ead3"); // 綠色
    } else if (recommendation === "維持現有配置") {
      sheet.getRange(startRow + i, 10).setBackground("#fff2cc"); // 黃色
    } else {
      sheet.getRange(startRow + i, 10).setBackground("#f4cccc"); // 紅色
    }
  }
  
  return startRow + timeSlotRows.length + 2; // 下一行加上空行
}

/**
 * 添加最佳時段醫師表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorTimeSlotData - 醫師時段數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addBestTimeSlotDoctorsTable(sheet, doctorTimeSlotData, startRow) {
  // 添加表格標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("2. 醫師時段效能分析").setFontWeight("bold");
  startRow++;
  
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(2.1) 各時段最高效能醫師");
  startRow++;
  
  // 準備表頭
  const headers = ["時段", "醫師", "診次數", "患者數", "消耗額", "每診患者數", "每診消耗額", "每人消耗額", "效能指數", "建議"];
  sheet.getRange(`A${startRow}:J${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 篩選有效數據
  const validData = doctorTimeSlotData.filter(d => 
    d.sessions > 0 && 
    d.timeSlot && 
    GLOBAL.TIME_SLOTS.includes(d.timeSlot)
  );
  
  // 按時段分組
  const timeSlotGroups = {};
  GLOBAL.TIME_SLOTS.forEach(timeSlot => {
    const timeSlotDoctors = validData.filter(d => d.timeSlot === timeSlot);
    if (timeSlotDoctors.length > 0) {
      // 按每診消耗額排序，取前3名
      timeSlotGroups[timeSlot] = timeSlotDoctors
        .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession)
        .slice(0, 3);
    }
  });
  
  // 計算每個時段的中位數效能
  const timeSlotMedians = {};
  GLOBAL.TIME_SLOTS.forEach(timeSlot => {
    const timeSlotDoctors = validData.filter(d => d.timeSlot === timeSlot);
    if (timeSlotDoctors.length > 0) {
      timeSlotMedians[timeSlot] = calculateMedian(timeSlotDoctors.map(d => d.consumptionPerSession));
    }
  });
  
  // 準備數據行
  let allRows = [];
  
  GLOBAL.TIME_SLOTS.forEach(timeSlot => {
    if (timeSlotGroups[timeSlot]) {
      const topDoctors = timeSlotGroups[timeSlot];
      const medianEfficiency = timeSlotMedians[timeSlot] || 1;
      
      const rows = topDoctors.map(doctor => {
        // 計算效能指數
        const efficiencyIndex = (doctor.consumptionPerSession / medianEfficiency * 100).toFixed(2);
        
        // 生成建議
        let recommendation;
        if (doctor.consumptionPerSession >= medianEfficiency * 1.2) {
          recommendation = "增加此時段診次";
        } else if (doctor.consumptionPerSession <= medianEfficiency * 0.8) {
          recommendation = "考慮調整時段";
        } else {
          recommendation = "維持現有配置";
        }
        
        return [
          timeSlot,
          doctor.doctor,
          doctor.sessions,
          doctor.patients,
          doctor.consumption,
          doctor.patientsPerSession.toFixed(2),
          doctor.consumptionPerSession.toFixed(2),
          doctor.consumptionPerPatient.toFixed(2),
          efficiencyIndex,
          recommendation
        ];
      });
      
      allRows = allRows.concat(rows);
    }
  });
  
  // 寫入數據
  if (allRows.length > 0) {
    sheet.getRange(startRow, 1, allRows.length, 10).setValues(allRows);
    
    // 設置效能指數和建議的顏色
    for (let i = 0; i < allRows.length; i++) {
      const efficiencyIndex = parseFloat(allRows[i][8]);
      const recommendation = allRows[i][9];
      
      // 效能指數顏色
      if (efficiencyIndex >= 120) {
        sheet.getRange(startRow + i, 9).setBackground("#d9ead3"); // 綠色
      } else if (efficiencyIndex >= 80) {
        sheet.getRange(startRow + i, 9).setBackground("#fff2cc"); // 黃色
      } else {
        sheet.getRange(startRow + i, 9).setBackground("#f4cccc"); // 紅色
      }
      
      // 建議顏色
      if (recommendation === "增加此時段診次") {
        sheet.getRange(startRow + i, 10).setBackground("#d9ead3"); // 綠色
      } else if (recommendation === "維持現有配置") {
        sheet.getRange(startRow + i, 10).setBackground("#fff2cc"); // 黃色
      } else {
        sheet.getRange(startRow + i, 10).setBackground("#f4cccc"); // 紅色
      }
    }
    
    startRow += allRows.length;
  }
  
  return startRow + 2; // 下一行加上空行
}

/**
 * 添加最佳時段診所表
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} clinicTimeSlotData - 診所時段數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addBestTimeSlotClinicsTable(sheet, clinicTimeSlotData, startRow) {
  // 添加表格標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(2.2) 各診所最佳時段分析").setFontWeight("bold");
  startRow++;
  
  // 準備表頭
  const headers = ["診所", "最佳時段", "診次數", "患者數", "消耗額", "每診患者數", "每診消耗額", "每人消耗額", "較平均提升", "建議"];
  sheet.getRange(`A${startRow}:J${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 篩選有效數據
  const validData = clinicTimeSlotData.filter(d => 
    d.sessions > 0 && 
    d.timeSlot && 
    GLOBAL.TIME_SLOTS.includes(d.timeSlot)
  );
  
  // 按診所分組
  const clinicGroups = {};
  const allClinics = [...new Set(validData.map(d => d.clinic))];
  
  allClinics.forEach(clinic => {
    const clinicTimeSlots = validData.filter(d => d.clinic === clinic);
    if (clinicTimeSlots.length > 0) {
      // 按每診消耗額排序，取最高的時段
      clinicGroups[clinic] = clinicTimeSlots.sort((a, b) => b.consumptionPerSession - a.consumptionPerSession)[0];
    }
  });
  
  // 計算每個診所的平均效能
  const clinicAverages = {};
  allClinics.forEach(clinic => {
    const clinicRecords = validData.filter(d => d.clinic === clinic);
    if (clinicRecords.length > 0) {
      const totalConsumptionPerSession = clinicRecords.reduce((sum, record) => sum + record.consumptionPerSession, 0);
      clinicAverages[clinic] = totalConsumptionPerSession / clinicRecords.length;
    }
  });
  
  // 準備數據行
  const clinicRows = Object.values(clinicGroups).map(bestTimeSlot => {
    const clinicAvg = clinicAverages[bestTimeSlot.clinic] || 1;
    
    // 計算較平均提升百分比
    const improvementPct = ((bestTimeSlot.consumptionPerSession / clinicAvg - 1) * 100).toFixed(2) + "%";
    
    // 生成建議
    let recommendation;
    if (bestTimeSlot.consumptionPerSession >= clinicAvg * 1.2) {
      recommendation = "增加此時段診次";
    } else {
      recommendation = "平衡各時段資源";
    }
    
    return [
      bestTimeSlot.clinic,
      bestTimeSlot.timeSlot,
      bestTimeSlot.sessions,
      bestTimeSlot.patients,
      bestTimeSlot.consumption,
      bestTimeSlot.patientsPerSession.toFixed(2),
      bestTimeSlot.consumptionPerSession.toFixed(2),
      bestTimeSlot.consumptionPerPatient.toFixed(2),
      improvementPct,
      recommendation
    ];
  });
  
  // 按較平均提升百分比降序排序
  clinicRows.sort((a, b) => {
    const pctA = parseFloat(a[8]);
    const pctB = parseFloat(b[8]);
    return pctB - pctA;
  });
  
  // 寫入數據
  if (clinicRows.length > 0) {
    sheet.getRange(startRow, 1, clinicRows.length, 10).setValues(clinicRows);
    
    // 設置提升百分比和建議的顏色
    for (let i = 0; i < clinicRows.length; i++) {
      const improvement = parseFloat(clinicRows[i][8]);
      const recommendation = clinicRows[i][9];
      
      // 提升百分比顏色
      if (improvement >= 20) {
        sheet.getRange(startRow + i, 9).setBackground("#d9ead3"); // 綠色
      } else if (improvement >= 5) {
        sheet.getRange(startRow + i, 9).setBackground("#fff2cc"); // 黃色
      } else {
        sheet.getRange(startRow + i, 9).setBackground("#f4cccc"); // 紅色
      }
      
      // 建議顏色
      if (recommendation === "增加此時段診次") {
        sheet.getRange(startRow + i, 10).setBackground("#d9ead3"); // 綠色
      } else {
        sheet.getRange(startRow + i, 10).setBackground("#fff2cc"); // 黃色
      }
    }
    
    startRow += clinicRows.length;
  }
  
  return startRow + 2; // 下一行加上空行
}

/**
 * 添加時段優化建議
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} timeSlotData - 時段數據
 * @param {Array} doctorTimeSlotData - 醫師時段數據
 * @param {Array} clinicTimeSlotData - 診所時段數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addTimeSlotOptimizationSuggestions(sheet, timeSlotData, doctorTimeSlotData, clinicTimeSlotData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("3. 時段最佳化建議").setFontWeight("bold");
  startRow++;
  
  // 統計最佳時段
  const validTimeSlots = timeSlotData.filter(ts => GLOBAL.TIME_SLOTS.includes(ts.name) && ts.sessions > 0);
  const sortedTimeSlots = [...validTimeSlots].sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  // 整體最佳時段
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  if (sortedTimeSlots.length > 0) {
    const bestTimeSlot = sortedTimeSlots[0];
    sheet.getRange(`A${startRow}`).setValue(
      `(3.1) 整體最佳時段：${bestTimeSlot.name}，每診消耗額 ${bestTimeSlot.consumptionPerSession.toFixed(2)}，建議增加此時段診次總數。`
    );
  } else {
    sheet.getRange(`A${startRow}`).setValue("(3.1) 無有效時段數據");
  }
  startRow++;
  
  // 找出最適合早診/午診/晚診的醫師
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.2) 各時段最佳醫師配置：");
  startRow++;
  
  // 過濾有效數據
  const validDoctorTimeSlotData = doctorTimeSlotData.filter(d => 
    d.sessions > 0 && 
    d.timeSlot && 
    GLOBAL.TIME_SLOTS.includes(d.timeSlot)
  );
  
  // 按時段分組，找出每個時段表現最好的醫師
  GLOBAL.TIME_SLOTS.forEach(timeSlot => {
    const timeSlotDoctors = validDoctorTimeSlotData.filter(d => d.timeSlot === timeSlot)
      .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
    
    if (timeSlotDoctors.length > 0) {
      const topDoctors = timeSlotDoctors.slice(0, Math.min(3, timeSlotDoctors.length));
      
      sheet.getRange(`A${startRow}:J${startRow}`).merge();
      sheet.getRange(`A${startRow}`).setValue(`${timeSlot}最佳醫師：`);
      startRow++;
      
      topDoctors.forEach(doctor => {
        sheet.getRange(`A${startRow}:J${startRow}`).merge();
        sheet.getRange(`A${startRow}`).setValue(
          `  ${doctor.doctor}：每診消耗額 ${doctor.consumptionPerSession.toFixed(2)}，每診患者 ${doctor.patientsPerSession.toFixed(2)}`
        );
        startRow++;
      });
    }
  });
  
  startRow++;
  
  // 診所時段優化建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.3) 診所時段資源配置建議：");
  startRow++;
  
  // 找出每個診所不同時段的效能差異
  const allClinics = [...new Set(clinicTimeSlotData.filter(d => d.sessions > 0).map(d => d.clinic))];
  
  allClinics.forEach(clinic => {
    const clinicTimeSlots = clinicTimeSlotData.filter(d => d.clinic === clinic && d.sessions > 0 && GLOBAL.TIME_SLOTS.includes(d.timeSlot))
      .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
    
    if (clinicTimeSlots.length > 1) { // 至少有兩個時段才能比較
      const bestTimeSlot = clinicTimeSlots[0];
      const worstTimeSlot = clinicTimeSlots[clinicTimeSlots.length - 1];
      
      const improvementPct = ((bestTimeSlot.consumptionPerSession / worstTimeSlot.consumptionPerSession - 1) * 100).toFixed(2);
      
      sheet.getRange(`A${startRow}:J${startRow}`).merge();
      sheet.getRange(`A${startRow}`).setValue(
        `${clinic}：最佳時段為 ${bestTimeSlot.timeSlot}，效能較 ${worstTimeSlot.timeSlot} 高 ${improvementPct}%，建議調整資源分配。`
      );
      startRow++;
    }
  });
  
  startRow++;
  
  // 添加整體建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.4) 時段資源最佳化總結：").setFontWeight("bold");
  startRow++;
  
  const suggestions = [
    "將高效醫師優先安排在高效時段，最大化整體績效",
    "針對效能較低的時段，考慮調整醫師組合或減少診次數",
    "定期分析時段效能數據，動態調整資源配置",
    "考慮診所特性和客群特性，合理安排醫師時段",
    "對於效能差異顯著的診所，檢視各時段人力和設備使用狀況"
  ];
  
  suggestions.forEach(suggestion => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${suggestion}`);
    startRow++;
  });
  
  return startRow;
}

/**
 * 創建聚類分析報表
 * @param {SpreadsheetApp.Spreadsheet} ss - 試算表
 * @param {Array} doctorData - 醫師數據
 * @param {Array} clinicData - 診所數據
 * @param {Array} doctorClinicData - 醫師-診所數據
 */
function createClusterAnalysisReport(ss, doctorData, clinicData, doctorClinicData) {
  // 創建聚類分析工作表
  let reportSheet = ss.getSheetByName("聚類分析報表");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("聚類分析報表");
  } else {
    reportSheet.clear();
  }
  
  // 設置標題
  reportSheet.getRange("A1:J1").merge();
  reportSheet.getRange("A1").setValue("醫療診所聚類分析報表").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加說明
  reportSheet.getRange("A2:J2").merge();
  reportSheet.getRange("A2").setValue("本報表使用聚類分析方法識別相似表現的醫師與診所群組，以優化資源配置與營運策略。");
  
  // 添加醫師聚類分析
  addDoctorClusterAnalysis(reportSheet, doctorData, 4);
  
  // 添加診所聚類分析
  addClinicClusterAnalysis(reportSheet, clinicData, 22);
  
  // 添加醫師-診所組合聚類分析
  addDoctorClinicClusterAnalysis(reportSheet, doctorClinicData, 40);
  
  // 格式化工作表
  formatReportSheet(reportSheet);
}

/**
 * 添加醫師聚類分析
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorData - 醫師數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addDoctorClusterAnalysis(sheet, doctorData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("1. 醫師績效聚類分析").setFontWeight("bold");
  startRow++;
  
  // 過濾有效數據
  const validDoctors = doctorData.filter(d => d.sessions > 0);
  
  // 按效能分類
  const clusterByEfficiency = performKMeans(
    validDoctors, 
    d => [d.consumptionPerSession], 
    4
  );
  
  // 添加效能聚類結果
  addClusterTable(
    sheet, 
    "(1.1) 醫師效能聚類（按每診消耗額）:", 
    clusterByEfficiency, 
    ["群組", "醫師數", "每診平均消耗額", "醫師名單"],
    startRow
  );
  startRow += 7;
  
  // 按患者量分類
  const clusterByVolume = performKMeans(
    validDoctors, 
    d => [d.patientsPerSession], 
    3
  );
  
  // 添加患者量聚類結果
  addClusterTable(
    sheet, 
    "(1.2) 醫師患者量聚類（按每診患者數）:", 
    clusterByVolume, 
    ["群組", "醫師數", "每診平均患者數", "醫師名單"],
    startRow
  );
  startRow += 6;
  
  // 按多維度分類
  const clusterByMultiDimensions = performKMeans(
    validDoctors, 
    d => [
      // 標準化數值，避免某一維度主導聚類結果
      normalize(d.patientsPerSession, validDoctors.map(d => d.patientsPerSession)),
      normalize(d.consumptionPerPatient, validDoctors.map(d => d.consumptionPerPatient))
    ], 
    4
  );
  
  // 添加多維度聚類結果
  addClusterTable(
    sheet, 
    "(1.3) 醫師多維聚類（患者數+消耗額）:", 
    clusterByMultiDimensions, 
    ["群組", "醫師數", "平均特徵向量", "醫師名單", "建議"],
    startRow,
    true
  );
  
  return startRow + 10; // 返回下一個可用行，加上一些間距
}

/**
 * 添加診所聚類分析
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} clinicData - 診所數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addClinicClusterAnalysis(sheet, clinicData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("2. 診所績效聚類分析").setFontWeight("bold");
  startRow++;
  
  // 過濾有效數據
  const validClinics = clinicData.filter(c => c.sessions > 0);
  
  // 如果診所數量太少，不執行聚類分析
  if (validClinics.length < 4) {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue("診所數量不足，無法執行有意義的聚類分析。");
    return startRow + 2;
  }
  
  // 按效能分類
  const clusterByEfficiency = performKMeans(
    validClinics, 
    c => [c.consumptionPerSession], 
    Math.min(3, Math.floor(validClinics.length / 2))
  );
  
  // 添加效能聚類結果
  addClusterTable(
    sheet, 
    "(2.1) 診所效能聚類（按每診消耗額）:", 
    clusterByEfficiency, 
    ["群組", "診所數", "每診平均消耗額", "診所名單"],
    startRow
  );
  startRow += 7;
  
  // 按多維度分類
  const clusterByMultiDimensions = performKMeans(
    validClinics, 
    c => [
      // 標準化數值
      normalize(c.patientsPerSession, validClinics.map(c => c.patientsPerSession)),
      normalize(c.consumptionPerPatient, validClinics.map(c => c.consumptionPerPatient))
    ], 
    Math.min(3, Math.floor(validClinics.length / 2))
  );
  
  // 添加多維度聚類結果
  addClusterTable(
    sheet, 
    "(2.2) 診所多維聚類（患者數+消耗額）:", 
    clusterByMultiDimensions, 
    ["群組", "診所數", "平均特徵向量", "診所名單", "建議"],
    startRow,
    true
  );
  
  return startRow + 10;
}

/**
 * 添加醫師-診所組合聚類分析
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorClinicData - 醫師-診所數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addDoctorClinicClusterAnalysis(sheet, doctorClinicData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("3. 醫師-診所組合聚類分析").setFontWeight("bold");
  startRow++;
  
  // 過濾有效數據
  const validCombinations = doctorClinicData.filter(dc => dc.sessions > 0);
  
  // 按效能分類
  const clusterByEfficiency = performKMeans(
    validCombinations, 
    dc => [dc.consumptionPerSession], 
    4
  );
  
  // 添加效能聚類結果
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.1) 醫師-診所效能聚類（按每診消耗額）:");
  startRow++;
  
  // 創建表頭
  const headers = ["群組", "組合數", "每診平均消耗額", "效能水平", "醫師-診所組合"];
  sheet.getRange(`A${startRow}:E${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 自定義顯示函數：將組合顯示為醫師@診所的形式
  const mapFunction = cluster => {
    const avgEfficiency = cluster.reduce((sum, dc) => sum + dc.consumptionPerSession, 0) / cluster.length;
    
    let efficiencyLevel;
    if (avgEfficiency >= 10000) {
      efficiencyLevel = "極高效能";
    } else if (avgEfficiency >= 5000) {
      efficiencyLevel = "高效能";
    } else if (avgEfficiency >= 2000) {
      efficiencyLevel = "中等效能";
    } else {
      efficiencyLevel = "低效能";
    }
    
    // 取最多5個組合顯示
    const combinations = cluster.slice(0, 5).map(dc => `${dc.doctor}@${dc.clinic}`).join(", ");
    const additionalCount = cluster.length > 5 ? `...等${cluster.length}個組合` : "";
    
    return [
      `群組${cluster.groupIndex + 1}`,
      cluster.length,
      avgEfficiency.toFixed(2),
      efficiencyLevel,
      combinations + (additionalCount ? ` ${additionalCount}` : "")
    ];
  };
  
  // 填充數據
  const rows = clusterByEfficiency
    .sort((a, b) => {
      const avgA = a.reduce((sum, dc) => sum + dc.consumptionPerSession, 0) / a.length;
      const avgB = b.reduce((sum, dc) => sum + dc.consumptionPerSession, 0) / b.length;
      return avgB - avgA;
    })
    .map((cluster, index) => {
      cluster.groupIndex = index;
      return mapFunction(cluster);
    });
  
  sheet.getRange(startRow, 1, rows.length, 5).setValues(rows);
  
      // 設置效能水平的顏色
  for (let i = 0; i < rows.length; i++) {
    const efficiencyLevel = rows[i][3];
    if (efficiencyLevel === "極高效能") {
      sheet.getRange(startRow + i, 4).setBackground("#d9ead3"); // 綠色
    } else if (efficiencyLevel === "高效能") {
      sheet.getRange(startRow + i, 4).setBackground("#b6d7a8"); // 淺綠色
    } else if (efficiencyLevel === "中等效能") {
      sheet.getRange(startRow + i, 4).setBackground("#fff2cc"); // 黃色
    } else {
      sheet.getRange(startRow + i, 4).setBackground("#f4cccc"); // 紅色
    }
  }
  
  startRow += rows.length + 2;
  
  // 多維度聚類分析
  const multiDimensionalClusters = performKMeans(
    validCombinations,
    dc => [
      normalize(dc.patientsPerSession, validCombinations.map(dc => dc.patientsPerSession)),
      normalize(dc.consumptionPerPatient, validCombinations.map(dc => dc.consumptionPerPatient)),
      normalize(dc.consumptionPerSession, validCombinations.map(dc => dc.consumptionPerSession))
    ],
    5
  );
  
  // 添加多維度聚類結果
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.2) 醫師-診所多維聚類分析:");
  startRow++;
  
  // 解釋聚類維度
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("多維聚類使用每診患者數、每人消耗額和每診消耗額三個維度，找出具有相似表現特徵的醫師-診所組合。");
  startRow++;
  
  // 創建表頭
  const multiHeaders = ["群組", "組合數", "特徵概述", "典型特性", "策略建議"];
  sheet.getRange(`A${startRow}:E${startRow}`).setValues([multiHeaders]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 分析每個聚類的特徵
  const multiRows = multiDimensionalClusters
    .map((cluster, index) => {
      // 計算平均值
      const avgPatientsPerSession = cluster.reduce((sum, dc) => sum + dc.patientsPerSession, 0) / cluster.length;
      const avgConsumptionPerPatient = cluster.reduce((sum, dc) => sum + dc.consumptionPerPatient, 0) / cluster.length;
      const avgConsumptionPerSession = cluster.reduce((sum, dc) => sum + dc.consumptionPerSession, 0) / cluster.length;
      
      // 聚類特徵描述
      let clusterFeature;
      if (avgPatientsPerSession > 10 && avgConsumptionPerPatient > 1000) {
        clusterFeature = "高量高值型";
      } else if (avgPatientsPerSession > 10) {
        clusterFeature = "高患者量型";
      } else if (avgConsumptionPerPatient > 1000) {
        clusterFeature = "高客單價型";
      } else if (avgConsumptionPerSession > 8000) {
        clusterFeature = "高總效能型";
      } else {
        clusterFeature = "基礎服務型";
      }
      
      // 典型特性
      let typicalCharacteristics;
      if (clusterFeature === "高量高值型") {
        typicalCharacteristics = "患者數量多，且單患者消耗高，總體效能極佳";
      } else if (clusterFeature === "高患者量型") {
        typicalCharacteristics = "接診量大，但單患者消耗偏低，適合基礎診療";
      } else if (clusterFeature === "高客單價型") {
        typicalCharacteristics = "患者數較少，但單患者消耗高，適合精品服務";
      } else if (clusterFeature === "高總效能型") {
        typicalCharacteristics = "整體效能佳，各項指標平衡";
      } else {
        typicalCharacteristics = "各項指標均處於中低水平，需全面提升";
      }
      
      // 策略建議
      let strategySuggestion;
      if (clusterFeature === "高量高值型") {
        strategySuggestion = "維持現狀，可考慮擴大規模，增加診次";
      } else if (clusterFeature === "高患者量型") {
        strategySuggestion = "提升產品組合和服務價值，增加客單價";
      } else if (clusterFeature === "高客單價型") {
        strategySuggestion = "增加患者基數，擴大優質服務覆蓋範圍";
      } else if (clusterFeature === "高總效能型") {
        strategySuggestion = "微調優化，保持平衡發展";
      } else {
        strategySuggestion = "重新檢視醫師配置與診所定位，調整營運策略";
      }
      
      return [
        `群組${index + 1}`,
        cluster.length,
        clusterFeature,
        typicalCharacteristics,
        strategySuggestion
      ];
    });
  
  // 寫入數據
  sheet.getRange(startRow, 1, multiRows.length, 5).setValues(multiRows);
  
  // 設置特徵概述的顏色
  for (let i = 0; i < multiRows.length; i++) {
    const clusterFeature = multiRows[i][2];
    if (clusterFeature === "高量高值型") {
      sheet.getRange(startRow + i, 3).setBackground("#d9ead3"); // 綠色
    } else if (clusterFeature === "高總效能型") {
      sheet.getRange(startRow + i, 3).setBackground("#b6d7a8"); // 淺綠色
    } else if (clusterFeature === "高患者量型" || clusterFeature === "高客單價型") {
      sheet.getRange(startRow + i, 3).setBackground("#fff2cc"); // 黃色
    } else {
      sheet.getRange(startRow + i, 3).setBackground("#f4cccc"); // 紅色
    }
  }
  
  // 添加聚類分析簡介
  startRow += multiRows.length + 2;
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("3.3 聚類分析總結").setFontWeight("bold");
  startRow++;
  
  const clusterSummaries = [
    "聚類分析將醫師-診所組合分為不同特性的群組，有助於制定差異化策略",
    "高效能組合應維持並擴大規模，低效能組合需檢討並重新配置",
    "群組間的差異反映了醫師專長與診所定位的匹配程度",
    "可根據聚類結果優化資源分配，將醫師分配至最適合的診所和時段"
  ];
  
  clusterSummaries.forEach(summary => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${summary}`);
    startRow++;
  });
  
  return startRow + 2;
}

/**
 * 創建最佳配置建議報表
 * @param {SpreadsheetApp.Spreadsheet} ss - 試算表
 * @param {Array} doctorData - 醫師數據
 * @param {Array} clinicData - 診所數據
 * @param {Array} timeSlotData - 時段數據
 * @param {Array} doctorClinicData - 醫師-診所數據
 */
function createOptimizationSuggestionsReport(ss, doctorData, clinicData, timeSlotData, doctorClinicData) {
  // 創建優化建議工作表
  let reportSheet = ss.getSheetByName("資源優化建議報表");
  if (!reportSheet) {
    reportSheet = ss.insertSheet("資源優化建議報表");
  } else {
    reportSheet.clear();
  }
  
  // 設置標題
  reportSheet.getRange("A1:J1").merge();
  reportSheet.getRange("A1").setValue("醫療診所資源最佳化配置建議").setFontWeight("bold").setHorizontalAlignment("center");
  
  // 添加說明
  reportSheet.getRange("A2:J2").merge();
  reportSheet.getRange("A2").setValue("本報表基於績效數據分析，提供醫師分配、診所資源配置與時段安排的最佳化建議。");
  
  // 添加醫師配置建議
  addDoctorOptimizationSuggestions(reportSheet, doctorData, doctorClinicData, 4);
  
  // 添加診所資源配置建議
  const doctorSectionRows = 20; // 估計醫師建議部分的行數
  addClinicOptimizationSuggestions(reportSheet, clinicData, timeSlotData, doctorClinicData, 4 + doctorSectionRows);
  
  // 添加時段優化建議
  const clinicSectionRows = 15; // 估計診所建議部分的行數
  addTimeSlotOptimizationSuggestions(reportSheet, timeSlotData, doctorClinicData, 4 + doctorSectionRows + clinicSectionRows);
  
  // 添加綜合優化策略
  const timeSlotSectionRows = 15; // 估計時段建議部分的行數
  addIntegratedOptimizationStrategy(reportSheet, 4 + doctorSectionRows + clinicSectionRows + timeSlotSectionRows);
  
  // 格式化工作表
  formatReportSheet(reportSheet);
}

/**
 * 添加醫師配置建議
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} doctorData - 醫師數據
 * @param {Array} doctorClinicData - 醫師-診所數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addDoctorOptimizationSuggestions(sheet, doctorData, doctorClinicData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("1. 醫師資源配置最佳化建議").setFontWeight("bold");
  startRow++;
  
  // 篩選有效醫師數據
  const validDoctors = doctorData.filter(d => d.sessions > 0);
  
  // 按效能排序
  const sortedDoctors = [...validDoctors].sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  // 分類醫師
  const topDoctors = sortedDoctors.slice(0, Math.ceil(sortedDoctors.length * 0.2)); // 前20%
  const middleDoctors = sortedDoctors.slice(Math.ceil(sortedDoctors.length * 0.2), Math.ceil(sortedDoctors.length * 0.8)); // 中間60%
  const bottomDoctors = sortedDoctors.slice(Math.ceil(sortedDoctors.length * 0.8)); // 後20%
  
  // 添加醫師分類和建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(1.1) 醫師績效分類與配置建議:");
  startRow++;
  
  // 表頭
  const headers = ["分類", "醫師數", "平均每診消耗額", "代表醫師", "配置建議"];
  sheet.getRange(`A${startRow}:E${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 準備數據
  const topPerformanceAvg = topDoctors.reduce((sum, d) => sum + d.consumptionPerSession, 0) / topDoctors.length;
  const middlePerformanceAvg = middleDoctors.reduce((sum, d) => sum + d.consumptionPerSession, 0) / middleDoctors.length;
  const bottomPerformanceAvg = bottomDoctors.reduce((sum, d) => sum + d.consumptionPerSession, 0) / bottomDoctors.length;
  
  const rows = [
    [
      "高效能醫師 (前20%)",
      topDoctors.length,
      topPerformanceAvg.toFixed(2),
      topDoctors.slice(0, 3).map(d => d.name).join(", "),
      "優先分配至高需求診所和高效時段，增加診次"
    ],
    [
      "中效能醫師 (中間60%)",
      middleDoctors.length,
      middlePerformanceAvg.toFixed(2),
      middleDoctors.slice(0, 3).map(d => d.name).join(", "),
      "平衡分配，提供培訓提升產品組合與服務價值"
    ],
    [
      "待提升醫師 (後20%)",
      bottomDoctors.length,
      bottomPerformanceAvg.toFixed(2),
      bottomDoctors.slice(0, 3).map(d => d.name).join(", "),
      "檢討診次配置，提供專業培訓，調整服務內容"
    ]
  ];
  
  // 寫入數據
  sheet.getRange(startRow, 1, rows.length, 5).setValues(rows);
  
  // 設置類別顏色
  sheet.getRange(startRow, 1).setBackground("#d9ead3");     // 綠色
  sheet.getRange(startRow + 1, 1).setBackground("#fff2cc"); // 黃色
  sheet.getRange(startRow + 2, 1).setBackground("#f4cccc"); // 紅色
  
  startRow += rows.length + 2;
  
  // 找出醫師在不同診所的表現差異
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(1.2) 醫師跨診所表現差異分析:");
  startRow++;
  
  // 找出有顯著差異的醫師
  const significantDifferenceDoctors = [];
  
  // 遍歷每位醫師
  for (const doctor of validDoctors) {
    const doctorName = doctor.name;
    
    // 找出該醫師在不同診所的記錄
    const doctorInClinics = doctorClinicData.filter(dc => 
      dc.doctor === doctorName && dc.sessions >= 3 // 至少有3個診次才有意義
    );
    
    // 如果醫師在多個診所執業
    if (doctorInClinics.length > 1) {
      // 按效能排序
      doctorInClinics.sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
      
      // 計算最佳和最差診所的效能差異
      const bestClinic = doctorInClinics[0];
      const worstClinic = doctorInClinics[doctorInClinics.length - 1];
      
      const performanceDiff = (bestClinic.consumptionPerSession / worstClinic.consumptionPerSession - 1) * 100;
      
      // 如果差異超過20%，記錄該醫師
      if (performanceDiff > 20) {
        significantDifferenceDoctors.push({
          doctor: doctorName,
          bestClinic: bestClinic.clinic,
          bestPerformance: bestClinic.consumptionPerSession,
          worstClinic: worstClinic.clinic,
          worstPerformance: worstClinic.consumptionPerSession,
          difference: performanceDiff
        });
      }
    }
  }
  
  // 如果有顯著差異的醫師
  if (significantDifferenceDoctors.length > 0) {
    // 按差異排序
    significantDifferenceDoctors.sort((a, b) => b.difference - a.difference);
    
    // 表頭
    const diffHeaders = ["醫師", "最佳診所", "每診消耗額", "最差診所", "每診消耗額", "差異百分比", "建議"];
    sheet.getRange(`A${startRow}:G${startRow}`).setValues([diffHeaders]).setFontWeight("bold").setBackground("#E0E0E0");
    startRow++;
    
    // 準備數據
    const diffRows = significantDifferenceDoctors.map(diff => {
      let suggestion;
      if (diff.difference > 50) {
        suggestion = "優先分配至最佳表現診所，減少最差診所診次";
      } else {
        suggestion = "檢討診所差異原因，尋求調整與改善";
      }
      
      return [
        diff.doctor,
        diff.bestClinic,
        diff.bestPerformance.toFixed(2),
        diff.worstClinic,
        diff.worstPerformance.toFixed(2),
        diff.difference.toFixed(2) + "%",
        suggestion
      ];
    });
    
    // 只顯示前5名
    const topDiffs = diffRows.slice(0, Math.min(5, diffRows.length));
    sheet.getRange(startRow, 1, topDiffs.length, 7).setValues(topDiffs);
    
    // 為差異百分比設置顏色
    for (let i = 0; i < topDiffs.length; i++) {
      const diff = parseFloat(topDiffs[i][5]);
      if (diff > 50) {
        sheet.getRange(startRow + i, 6).setBackground("#f4cccc"); // 紅色
      } else if (diff > 30) {
        sheet.getRange(startRow + i, 6).setBackground("#fce5cd"); // 橙色
      } else {
        sheet.getRange(startRow + i, 6).setBackground("#fff2cc"); // 黃色
      }
    }
    
    startRow += topDiffs.length + 1;
  } else {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue("未發現醫師在不同診所有顯著表現差異。");
    startRow++;
  }
  
  // 添加綜合建議
  startRow++;
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(1.3) 醫師配置綜合建議:").setFontWeight("bold");
  startRow++;
  
  const suggestions = [
    "將高效醫師優先配置於高需求診所和高效時段，提高整體資源利用效率",
    "對於跨診所表現差異大的醫師，建議重新評估其專業匹配度",
    "中效醫師可適度輪調不同診所，尋找最佳匹配點",
    "低效醫師需檢討診次配置，提供必要培訓或調整專業方向",
    "定期評估醫師績效，動態調整資源配置"
  ];
  
  suggestions.forEach(suggestion => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${suggestion}`);
    startRow++;
  });
  
  return startRow + 2;
}

/**
 * 添加診所資源配置建議
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} clinicData - 診所數據
 * @param {Array} timeSlotData - 時段數據
 * @param {Array} doctorClinicData - 醫師-診所數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addClinicOptimizationSuggestions(sheet, clinicData, timeSlotData, doctorClinicData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("2. 診所資源配置最佳化建議").setFontWeight("bold");
  startRow++;
  
  // 篩選有效診所數據
  const validClinics = clinicData.filter(c => c.sessions > 0);
  
  // 按效能排序診所
  const sortedClinics = [...validClinics].sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  // 分類診所
  const topClinics = sortedClinics.slice(0, Math.ceil(sortedClinics.length * 0.3)); // 前30%
  const bottomClinics = sortedClinics.slice(-Math.ceil(sortedClinics.length * 0.3)); // 後30%
  
  // 添加診所效能差異分析
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(2.1) 診所效能差異分析:");
  startRow++;
  
  // 計算高低效能診所的均值
  const topAvg = topClinics.reduce((sum, c) => sum + c.consumptionPerSession, 0) / topClinics.length;
  const bottomAvg = bottomClinics.reduce((sum, c) => sum + c.consumptionPerSession, 0) / bottomClinics.length;
  const diffPct = ((topAvg / bottomAvg) - 1) * 100;
  
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue(
    `高效能診所(前30%)平均每診消耗額為 ${topAvg.toFixed(2)}，` +
    `低效能診所(後30%)平均為 ${bottomAvg.toFixed(2)}，差異達 ${diffPct.toFixed(2)}%。`
  );
  startRow++;
  
  // 表頭
  const headers = ["類型", "代表診所", "平均每診消耗額", "主要特點", "資源配置建議"];
  sheet.getRange(`A${startRow}:E${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 準備數據
  const rows = [
    [
      "高效能診所",
      topClinics.slice(0, 3).map(c => c.name).join(", "),
      topAvg.toFixed(2),
      "醫師配置優良，產品組合和時段安排合理",
      "增加診次數量，擴大服務範圍，提高資源利用率"
    ],
    [
      "低效能診所",
      bottomClinics.slice(0, 3).map(c => c.name).join(", "),
      bottomAvg.toFixed(2),
      "醫師配置或產品組合待優化",
      "重新評估醫師配置，調整產品組合和行銷策略"
    ]
  ];
  
  // 寫入數據
  sheet.getRange(startRow, 1, rows.length, 5).setValues(rows);
  
  // 設置類別顏色
  sheet.getRange(startRow, 1).setBackground("#d9ead3"); // 綠色
  sheet.getRange(startRow + 1, 1).setBackground("#f4cccc"); // 紅色
  
  startRow += rows.length + 2;
  
  // 添加最佳醫師組合建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(2.2) 診所最佳醫師組合建議:").setFontWeight("bold");
  startRow++;
  
  // 分析每個診所的最佳醫師組合
  for (const clinic of sortedClinics.slice(0, Math.min(5, sortedClinics.length))) {
    // 找出該診所所有醫師的表現
    const clinicDoctors = doctorClinicData.filter(dc => 
      dc.clinic === clinic.name && dc.sessions >= 3 // 至少有3個診次才有意義
    ).sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
    
    if (clinicDoctors.length > 0) {
      sheet.getRange(`A${startRow}:J${startRow}`).merge();
      sheet.getRange(`A${startRow}`).setValue(`${clinic.name}：`);
      startRow++;
      
      // 取表現最好的3位醫師
      const topDoctors = clinicDoctors.slice(0, Math.min(3, clinicDoctors.length));
      
      sheet.getRange(`A${startRow}:J${startRow}`).merge();
      sheet.getRange(`A${startRow}`).setValue(
        `  最佳醫師組合: ${topDoctors.map(d => d.doctor).join(", ")}，` +
        `平均每診消耗額: ${topDoctors.reduce((sum, d) => sum + d.consumptionPerSession, 0) / topDoctors.length.toFixed(2)}`
      );
      startRow++;
      
      sheet.getRange(`A${startRow}:J${startRow}`).merge();
      sheet.getRange(`A${startRow}`).setValue(
        `  建議: 優先安排這些醫師的診次，或尋找類似特性的醫師增加配置`
      );
      startRow++;
    }
  }
  
  startRow += 1;
  
  // 添加綜合建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(2.3) 診所資源配置綜合建議:").setFontWeight("bold");
  startRow++;
  
  const suggestions = [
    "根據診所特性和表現，差異化配置醫師資源",
    "高效診所可考慮增加診次，擴大服務範圍",
    "低效診所需重新評估醫師組合，考慮引入高效醫師",
    "分析每個診所的最佳時段，優化時段資源分配",
    "針對低效診所制定特定改善計劃，包括醫師培訓、產品調整等"
  ];
  
  suggestions.forEach(suggestion => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${suggestion}`);
    startRow++;
  });
  
  return startRow + 2;
}

/**
 * 添加時段優化建議
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {Array} timeSlotData - 時段數據
 * @param {Array} doctorClinicData - 醫師-診所數據
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addTimeSlotOptimizationSuggestions(sheet, timeSlotData, doctorClinicData, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("3. 時段資源配置最佳化建議").setFontWeight("bold");
  startRow++;
  
  // 篩選有效時段數據
  const validTimeSlots = timeSlotData.filter(ts => 
    GLOBAL.TIME_SLOTS.includes(ts.name) && ts.sessions > 0
  );
  
  // 按效能排序
  const sortedTimeSlots = [...validTimeSlots].sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
  
  // 添加時段效能分析
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.1) 時段效能分析:");
  startRow++;
  
  // 表頭
  const headers = ["時段", "診次數", "每診患者數", "每診消耗額", "診次占比", "效能指數", "資源配置建議"];
  sheet.getRange(`A${startRow}:G${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 計算總診次
  const totalSessions = validTimeSlots.reduce((sum, ts) => sum + ts.sessions, 0);
  
  // 計算效能中位數
  const medianEfficiency = calculateMedian(validTimeSlots.map(ts => ts.consumptionPerSession));
  
  // 準備數據
  const rows = sortedTimeSlots.map(timeSlot => {
    // 計算診次占比
    const sessionPercent = (timeSlot.sessions / totalSessions * 100).toFixed(2) + "%";
    
    // 計算效能指數
    const efficiencyIndex = (timeSlot.consumptionPerSession / medianEfficiency * 100).toFixed(2);
    
    // 生成建議
    let suggestion;
    if (parseFloat(efficiencyIndex) >= 120) {
      suggestion = "增加診次配置，優先安排高效醫師";
    } else if (parseFloat(efficiencyIndex) >= 80) {
      suggestion = "維持現有配置，微調優化";
    } else {
      suggestion = "減少診次配置，或調整醫師組合";
    }
    
    return [
      timeSlot.name,
      timeSlot.sessions,
      timeSlot.patientsPerSession.toFixed(2),
      timeSlot.consumptionPerSession.toFixed(2),
      sessionPercent,
      efficiencyIndex,
      suggestion
    ];
  });
  
  // 寫入數據
  sheet.getRange(startRow, 1, rows.length, 7).setValues(rows);
  
  // 設置效能指數顏色
  for (let i = 0; i < rows.length; i++) {
    const efficiencyIndex = parseFloat(rows[i][5]);
    if (efficiencyIndex >= 120) {
      sheet.getRange(startRow + i, 6).setBackground("#d9ead3"); // 綠色
    } else if (efficiencyIndex >= 80) {
      sheet.getRange(startRow + i, 6).setBackground("#fff2cc"); // 黃色
    } else {
      sheet.getRange(startRow + i, 6).setBackground("#f4cccc"); // 紅色
    }
  }
  
  startRow += rows.length + 2;
  
  // 添加醫師-時段最佳配置建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.2) 醫師-時段最佳配置建議:").setFontWeight("bold");
  startRow++;
  
  // 過濾有足夠樣本的醫師-時段組合
  const doctorTimeSlots = {};
  
  for (const dc of doctorClinicData) {
    if (dc.sessions >= 3 && dc.primaryTimeSlot && GLOBAL.TIME_SLOTS.includes(dc.primaryTimeSlot)) {
      const key = `${dc.doctor}_${dc.primaryTimeSlot}`;
      
      if (!doctorTimeSlots[key]) {
        doctorTimeSlots[key] = {
          doctor: dc.doctor,
          timeSlot: dc.primaryTimeSlot,
          sessions: 0,
          consumption: 0
        };
      }
      
      doctorTimeSlots[key].sessions += dc.sessions;
      doctorTimeSlots[key].consumption += dc.consumption;
    }
  }
  
  // 計算每診消耗額
  for (const key in doctorTimeSlots) {
    const dto = doctorTimeSlots[key];
    dto.consumptionPerSession = dto.consumption / dto.sessions;
  }
  
  // 按時段分組，找出每個時段最佳的醫師
  const timeSlotBestDoctors = {};
  
  for (const timeSlot of GLOBAL.TIME_SLOTS) {
    const timeSlotDoctors = Object.values(doctorTimeSlots)
      .filter(dto => dto.timeSlot === timeSlot)
      .sort((a, b) => b.consumptionPerSession - a.consumptionPerSession);
    
    if (timeSlotDoctors.length > 0) {
      timeSlotBestDoctors[timeSlot] = timeSlotDoctors.slice(0, Math.min(3, timeSlotDoctors.length));
    }
  }
  
  // 顯示每個時段最佳醫師
  for (const timeSlot in timeSlotBestDoctors) {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`${timeSlot}最適合的醫師：`);
    startRow++;
    
    const bestDoctors = timeSlotBestDoctors[timeSlot];
    bestDoctors.forEach(doctor => {
      sheet.getRange(`A${startRow}:J${startRow}`).merge();
      sheet.getRange(`A${startRow}`).setValue(
        `  ${doctor.doctor}：每診消耗額 ${doctor.consumptionPerSession.toFixed(2)}，建議優先安排在此時段`
      );
      startRow++;
    });
    
    startRow++;
  }
  
  // 添加綜合建議
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(3.3) 時段資源配置綜合建議:").setFontWeight("bold");
  startRow++;
  
  const suggestions = [
    "根據時段效能分析結果，重新分配診次資源",
    "高效時段應增加診次，優先安排表現最佳的醫師",
    "低效時段需重新評估醫師組合或減少診次配置",
    "考慮醫師個人在不同時段的表現差異，安排最佳時段",
    "定期檢視時段效能，動態調整資源配置"
  ];
  
  suggestions.forEach(suggestion => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${suggestion}`);
    startRow++;
  });
  
  return startRow + 2;
}

/**
 * 添加綜合優化策略
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {number} startRow - 起始行
 * @return {number} 下一個可用行
 */
function addIntegratedOptimizationStrategy(sheet, startRow) {
  // 添加標題
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("4. 綜合資源最佳化策略").setFontWeight("bold");
  startRow++;
  
  // 添加策略框架
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(4.1) 醫師-診所-時段三維優化框架:").setFontWeight("bold");
  startRow++;
  
  const framework = [
    "識別每個維度的高效與低效因素，進行匹配優化",
    "高效醫師 + 高效診所 + 高效時段 = 最大化資源效能",
    "低效醫師需配對高效診所或時段，以提升整體績效",
    "各維度資源配置應考慮整體平衡，避免過度集中"
  ];
  
  framework.forEach(point => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${point}`);
    startRow++;
  });
  
  startRow += 1;
  
  // 添加具體實施步驟
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(4.2) 資源最佳化實施步驟:").setFontWeight("bold");
  startRow++;
  
  const steps = [
    "步驟1：評估現有資源配置效能，識別優勢與劣勢",
    "步驟2：根據醫師績效分類，調整診次分配",
    "步驟3：優化診所醫師組合，提升資源利用率",
    "步驟4：根據時段效能分析，重新安排時段資源",
    "步驟5：實施動態監控機制，定期評估與調整"
  ];
  
  steps.forEach(step => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(step);
    startRow++;
  });
  
  startRow += 1;
  
  // 添加預期效益
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue("(4.3) 優化後預期效益:").setFontWeight("bold");
  startRow++;
  
  const benefits = [
    "整體效能提升：通過優化配置，預期整體每診消耗額提升15-20%",
    "資源利用率提高：減少低效時段與診次，提高資源利用效率",
    "醫師績效改善：通過最佳匹配，提升醫師個人績效",
    "診所效能均衡：縮小診所間的效能差距，實現均衡發展",
    "患者體驗優化：合理安排醫師與時段，提升服務質量與患者滿意度"
  ];
  
  benefits.forEach(benefit => {
    sheet.getRange(`A${startRow}:J${startRow}`).merge();
    sheet.getRange(`A${startRow}`).setValue(`• ${benefit}`);
    startRow++;
  });
  
  return startRow;
}

/**
 * 添加聚類表格
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} title - 表格標題
 * @param {Array} clusters - 聚類結果
 * @param {Array} headers - 表頭
 * @param {number} startRow - 起始行
 * @param {boolean} addSuggestions - 是否添加建議
 * @return {number} 下一個可用行
 */
/**
 * 添加自訂UI選單
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('醫療診所分析')
      .addItem('執行完整分析', 'AutoRun')
      .addItem('醫師篩選分析', 'showDoctorFilterUI')
      .addItem('清除空行', 'deleteBlankRows')
      .addToUi();
}

/**
 * 添加聚類表格
 * @param {SpreadsheetApp.Sheet} sheet - 工作表
 * @param {string} title - 表格標題
 * @param {Array} clusters - 聚類結果
 * @param {Array} headers - 表頭
 * @param {number} startRow - 起始行
 * @param {boolean} addSuggestions - 是否添加建議
 * @return {number} 下一個可用行
 */
function addClusterTable(sheet, title, clusters, headers, startRow, addSuggestions = false) {
  sheet.getRange(`A${startRow}:J${startRow}`).merge();
  sheet.getRange(`A${startRow}`).setValue(title);
  startRow++;
  
  sheet.getRange(`A${startRow}:${String.fromCharCode(65 + headers.length - 1)}${startRow}`).setValues([headers]).setFontWeight("bold").setBackground("#E0E0E0");
  startRow++;
  
  // 處理每個聚類
  clusters.forEach((cluster, index) => {
    // 計算群組平均值
    let avgValue;
    if (headers.includes("每診平均消耗額")) {
      avgValue = cluster.reduce((sum, item) => sum + item.consumptionPerSession, 0) / cluster.length;
    } else if (headers.includes("每診平均患者數")) {
      avgValue = cluster.reduce((sum, item) => sum + item.patientsPerSession, 0) / cluster.length;
    } else {
      // 多維聚類，使用特徵向量
      const featureVector = [
        cluster.reduce((sum, item) => sum + item.patientsPerSession, 0) / cluster.length,
        cluster.reduce((sum, item) => sum + item.consumptionPerPatient, 0) / cluster.length
      ];
      avgValue = `[${featureVector[0].toFixed(2)}, ${featureVector[1].toFixed(2)}]`;
    }
    
    // 獲取群組中的項目名稱列表（最多顯示3個）
    const items = cluster.slice(0, 3).map(item => item.name).join(", ");
    const totalCount = cluster.length;
    const itemsDisplay = totalCount > 3 ? `${items}...等${totalCount}個` : items;
    
    // 生成建議（如果需要）
    let suggestion = "";
    if (addSuggestions) {
      if (headers.includes("平均特徵向量")) {
        const avgPatients = cluster.reduce((sum, item) => sum + item.patientsPerSession, 0) / cluster.length;
        const avgConsumption = cluster.reduce((sum, item) => sum + item.consumptionPerPatient, 0) / cluster.length;
        
        if (avgPatients > 10 && avgConsumption > 1000) {
          suggestion = "維持現狀，可考慮擴大規模";
        } else if (avgPatients > 10) {
          suggestion = "提升產品組合，增加客單價";
        } else if (avgConsumption > 1000) {
          suggestion = "增加患者基數，擴大服務範圍";
        } else {
          suggestion = "全面檢討，提升整體效能";
        }
      }
    }
    
    // 準備行數據
    const rowData = [
      `群組${index + 1}`,
      cluster.length,
      avgValue,
      itemsDisplay
    ];
    
    if (addSuggestions) {
      rowData.push(suggestion);
    }
    
    // 寫入數據
    sheet.getRange(startRow, 1, 1, rowData.length).setValues([rowData]);
    
    // 設置群組顏色
    const colors = ["#d9ead3", "#fff2cc", "#cfe2f3", "#f4cccc", "#ead1dc"];
    sheet.getRange(startRow, 1).setBackground(colors[index % colors.length]);
    
    startRow++;
  });
  
  return startRow;
}

/**
 * 標準化數值
 * @param {number} value - 要標準化的值
 * @param {Array} allValues - 所有值的數組
 * @return {number} 標準化後的值
 */
function normalize(value, allValues) {
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  if (max === min) return 0.5; // 避免除以零
  
  return (value - min) / (max - min);
}

/**
 * 執行K-means聚類
 * @param {Array} data - 數據項
 * @param {Function} featureExtractor - 特徵提取函數
 * @param {number} k - 聚類數
 * @return {Array} 聚類結果
 */
function performKMeans(data, featureExtractor, k) {
  // 如果數據數量小於k，則每個數據作為一個聚類
  if (data.length <= k) {
    return data.map(item => [item]);
  }
  
  // 提取特徵
  const features = data.map(featureExtractor);
  
  // 選擇初始中心點
  const centroids = selectInitialCentroids(features, k);
  
  // 進行簡單的迭代
  const MAX_ITERATIONS = 10;
  let clusters = [];
  let previousClusters = [];
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // 重置聚類
    clusters = Array(k).fill().map(() => []);
    
    // 分配數據點到最近的中心點
    features.forEach((feature, index) => {
      const nearestCentroidIndex = findNearestCentroid(feature, centroids);
      clusters[nearestCentroidIndex].push({
        index,
        feature
      });
    });
    
    // 檢查是否收斂
    if (compareClusterAssignments(clusters, previousClusters)) {
      break;
    }
    
    // 更新中心點
    centroids.forEach((centroid, index) => {
      const clusterPoints = clusters[index];
      if (clusterPoints.length > 0) {
        // 計算新的中心點
        const newCentroid = calculateNewCentroid(clusterPoints);
        centroids[index] = newCentroid;
      }
    });
    
    previousClusters = JSON.parse(JSON.stringify(clusters));
  }
  
  // 將結果轉換回原始數據
  return clusters.map(cluster => 
    cluster.map(point => data[point.index])
  ).filter(cluster => cluster.length > 0); // 過濾空聚類
}

/**
 * 選擇初始中心點
 * @param {Array} features - 特徵數據
 * @param {number} k - 聚類數
 * @return {Array} 初始中心點
 */
function selectInitialCentroids(features, k) {
  const centroids = [];
  const featureLength = features.length;
  
  // 隨機選擇k個不同的點作為初始中心點
  const indices = new Set();
  while (indices.size < Math.min(k, featureLength)) {
    const randomIndex = Math.floor(Math.random() * featureLength);
    indices.add(randomIndex);
  }
  
  Array.from(indices).forEach(index => {
    centroids.push(features[index]);
  });
  
  return centroids;
}

/**
 * 找到最近的中心點
 * @param {Array} feature - 特徵向量
 * @param {Array} centroids - 中心點列表
 * @return {number} 最近中心點的索引
 */
function findNearestCentroid(feature, centroids) {
  let minDistance = Infinity;
  let nearestIndex = 0;
  
  centroids.forEach((centroid, index) => {
    const distance = euclideanDistance(feature, centroid);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = index;
    }
  });
  
  return nearestIndex;
}

/**
 * 計算歐氏距離
 * @param {Array} a - 向量a
 * @param {Array} b - 向量b
 * @return {number} 歐氏距離
 */
function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return Math.abs(a - b); // 如果是標量，則直接計算差的絕對值
  }
  
  return Math.sqrt(
    a.reduce((sum, value, index) => {
      const diff = value - (b[index] || 0);
      return sum + diff * diff;
    }, 0)
  );
}

/**
 * 計算新的中心點
 * @param {Array} clusterPoints - 聚類中的點
 * @return {Array} 新的中心點
 */
function calculateNewCentroid(clusterPoints) {
  if (clusterPoints.length === 0) return [];
  
  const firstFeature = clusterPoints[0].feature;
  
  // 檢查是否是多維特徵
  if (Array.isArray(firstFeature)) {
    const dimensions = firstFeature.length;
    const centroid = Array(dimensions).fill(0);
    
    clusterPoints.forEach(point => {
      point.feature.forEach((value, dim) => {
        centroid[dim] += value;
      });
    });
    
    return centroid.map(sum => sum / clusterPoints.length);
  } else {
    // 單維特徵
    const sum = clusterPoints.reduce((total, point) => total + point.feature, 0);
    return sum / clusterPoints.length;
  }
}

/**
 * 比較聚類分配是否相同
 * @param {Array} clusters1 - 聚類1
 * @param {Array} clusters2 - 聚類2
 * @return {boolean} 是否相同
 */
function compareClusterAssignments(clusters1, clusters2) {
  if (clusters2.length === 0) return false;
  
  // 檢查每個聚類的長度
  for (let i = 0; i < clusters1.length; i++) {
    if (!clusters2[i] || clusters1[i].length !== clusters2[i].length) {
      return false;
    }
    
    // 檢查每個點的分配
    const indices1 = new Set(clusters1[i].map(point => point.index));
    const indices2 = new Set(clusters2[i].map(point => point.index));
    
    if (indices1.size !== indices2.size) {
      return false;
    }
    
    for (const index of indices1) {
      if (!indices2.has(index)) {
        return false;
      }
    }
  }
  
  return true;
}