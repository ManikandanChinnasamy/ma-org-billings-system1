import React, { useState, useEffect, useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Picker,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { appStyles } from "../styles/Styles";

const SPREADSHEET_ID = "1QKTL_5g5Y3XsUsq2GDyyHdSDAszuMaZVlIkkxg7mDCU";
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "AIzaSyCI8acGqx7YK-ou16lPvkvx0Gfudi96_pg";

const Dashboard = ({ userInfo, onLogout }) => {
  const [sheetData, setSheetData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);

  const userRole = "admin";

  useEffect(() => {
    fetchSheetNames();
  }, []);

  useEffect(() => {
    if (selectedSheet) {
      fetchSheetData(selectedSheet);
    }
  }, [selectedSheet]);

  const fetchSheetNames = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        
        if (errorData.includes("This operation is not supported for this document")) {
          throw new Error(
            "OFFICE_FILE: Your spreadsheet is an Excel/Office file, not a native Google Sheet"
          );
        }
        throw new Error(`Failed to fetch sheet names (HTTP ${response.status})`);
      }

      const data = await response.json();
      const sheetList = data.sheets.map((sheet) => ({
        name: sheet.properties.title,
        id: sheet.properties.sheetId,
      }));

      setSheets(sheetList);

      if (sheetList.length > 0) {
        setSelectedSheet(sheetList[sheetList.length - 1].name);
      }
    } catch (err) {
      console.error("Error fetching sheet names:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchSheetData = async (sheetName) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Response:", errorData);
        throw new Error(
          `Failed to fetch sheet (HTTP ${response.status}). Make sure the spreadsheet is a native Google Sheet.`
        );
      }

      const data = await response.json();

      if (data.values && data.values.length > 0) {
        setHeaders(data.values[0]);
        setSheetData(data.values.slice(1));
        setError(null); // Clear any previous errors when data loads successfully
      } else {
        // Sheet is empty - set both to empty arrays, not an error
        setSheetData([]);
        setHeaders([]);
        setError(null); // Clear error state for empty sheet
      }
    } catch (err) {
      console.error("Error fetching sheet data:", err);
      setError(err.message);
      setSheetData([]);
      setHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSearchedData = useMemo(() => {
    let result = [...sheetData];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(query))
      );
    }

    return result;
  }, [sheetData, searchQuery]);

  const sortedData = useMemo(() => {
    let result = [...filteredAndSearchedData];

    if (sortColumn !== null && sortColumn !== undefined) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Handle undefined/null values
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        // Convert to appropriate types for comparison
        const aStr = String(aVal).toLowerCase().trim();
        const bStr = String(bVal).toLowerCase().trim();

        // Try numeric comparison if both look like numbers
        const aNum = parseFloat(aStr);
        const bNum = parseFloat(bStr);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        if (sortOrder === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [filteredAndSearchedData, sortColumn, sortOrder]);

  const toggleRowSelection = (rowIndex) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const selectAllRows = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = new Set(sortedData.map((_, i) => i));
      setSelectedRows(allIndices);
    }
  };

  const updateSheetData = async (rowIndices, newValues) => {
    try {
      setUpdating(true);
      
      Alert.alert(
        "Edit Data",
        "Due to API limitations with public sheets, direct editing through this app requires a service account.\n\nAlternative: Edit directly in Google Sheets and click 'Refresh' to see changes here.",
        [
          {
            text: "Open Google Sheet",
            onPress: () => {
              const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
              if (typeof window !== 'undefined' && window.open) {
                window.open(sheetUrl, '_blank');
              }
            },
          },
          {
            text: "OK",
            onPress: () => {
              setEditingRowIndex(null);
              setEditedValues({});
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error updating sheet:", err);
      Alert.alert("Error", "Failed to update data: " + err.message);
    } finally {
      setUpdating(false);
    }
  };
  
  const deleteRowsFromSheet = async (rowIndices) => {
    try {
      setUpdating(true);
      
      Alert.alert(
        "Delete Data",
        "Due to API limitations with public sheets, direct deletion through this app requires a service account.\n\nAlternative: Delete directly in Google Sheets and click 'Refresh' to see changes here.",
        [
          {
            text: "Open Google Sheet",
            onPress: () => {
              const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
              if (typeof window !== 'undefined' && window.open) {
                window.open(sheetUrl, '_blank');
              }
            },
          },
          {
            text: "OK",
            onPress: () => {
              setSelectedRows(new Set());
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error deleting rows:", err);
      Alert.alert("Error", "Failed to delete data: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
  }, [sortedData]);

  const generateBill = (rowData) => {
    const customerNameIdx = headers.indexOf("Customer Name");
    const phoneIdx = headers.indexOf("Phone Number");
    const productsIdx = headers.indexOf("Products");
    const daysIdx = headers.indexOf("Number of days");
    const quantityIdx = headers.indexOf("Total Quantity");
    const amountIdx = headers.indexOf("Amount");
    const outstandingIdx = headers.indexOf("Outstanding Balance");
    const balanceIdx = headers.indexOf("Total Balance");

    return {
      customerName: customerNameIdx >= 0 ? rowData[customerNameIdx] : "N/A",
      phoneNumber: phoneIdx >= 0 ? rowData[phoneIdx] : "N/A",
      products: productsIdx >= 0 ? rowData[productsIdx] : "N/A",
      days: daysIdx >= 0 ? rowData[daysIdx] : "N/A",
      quantity: quantityIdx >= 0 ? rowData[quantityIdx] : "N/A",
      amount: amountIdx >= 0 ? rowData[amountIdx] : "0",
      outstanding: outstandingIdx >= 0 ? rowData[outstandingIdx] : "0",
      totalBalance: balanceIdx >= 0 ? rowData[balanceIdx] : "0",
      generatedAt: new Date().toLocaleDateString(),
    };
  };

  const downloadBill = (rowIndex) => {
    const bill = generateBill(sortedData[rowIndex]);
    
    // Create canvas to draw the bill as an image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Set canvas dimensions (A4 size at 96 DPI)
    const width = 600;
    const height = 850;
    canvas.width = width;
    canvas.height = height;
    
    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    // Helper function to draw text with wrapping
    const drawText = (text, x, y, fontSize = 14, fontWeight = "normal", color = "#2c3e50", maxWidth = width - 40) => {
      ctx.fillStyle = color;
      ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "left";
      
      if (maxWidth && text.length > 50) {
        const words = text.split(" ");
        let line = "";
        let currentY = y;
        
        words.forEach((word) => {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, x, currentY);
            line = word + " ";
            currentY += fontSize + 5;
          } else {
            line = testLine;
          }
        });
        
        if (line) {
          ctx.fillText(line, x, currentY);
        }
        return currentY + fontSize + 5;
      } else {
        ctx.fillText(text, x, y);
        return y + fontSize + 5;
      }
    };
    
    // Helper function to draw a line
    const drawLine = (x1, y1, x2, y2, color = "#ecf0f1", width = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    
    // Helper function to draw a colored box
    const drawBox = (x, y, w, h, bgColor = "#f8f9fa", borderColor = null) => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
      if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }
    };
    
    let yPos = 30;
    
    // Header
    ctx.fillStyle = "#841584";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("📋 INVOICE", width / 2, yPos);
    yPos += 40;
    
    // Date
    ctx.fillStyle = "#7f8c8d";
    ctx.font = "14px Arial";
    ctx.fillText(`Generated on ${bill.generatedAt}`, width / 2, yPos);
    yPos += 30;
    
    // Divider line
    drawLine(30, yPos, width - 30, yPos, "#841584", 2);
    yPos += 20;
    
    // Customer Information Section
    ctx.fillStyle = "#841584";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Customer Information", 30, yPos);
    yPos += 25;
    
    drawBox(30, yPos, width - 60, 70, "#f4ebf8");
    yPos += 15;
    
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 12px Arial";
    ctx.fillText("Name:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.fillText(bill.customerName, 150, yPos);
    yPos += 20;
    
    ctx.font = "bold 12px Arial";
    ctx.fillText("Phone:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.fillText(bill.phoneNumber, 150, yPos);
    yPos += 20;
    
    ctx.font = "bold 12px Arial";
    ctx.fillText("Invoice Date:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.fillText(bill.generatedAt, 150, yPos);
    
    yPos += 50;
    
    // Service Details Section
    ctx.fillStyle = "#841584";
    ctx.font = "bold 14px Arial";
    ctx.fillText("Service Details", 30, yPos);
    yPos += 25;
    
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 12px Arial";
    ctx.fillText("Products:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.fillText(bill.products, 150, yPos);
    yPos += 20;
    
    ctx.font = "bold 12px Arial";
    ctx.fillText("Number of Days:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.fillText(bill.days, 150, yPos);
    yPos += 20;
    
    ctx.font = "bold 12px Arial";
    ctx.fillText("Total Quantity:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.fillText(bill.quantity, 150, yPos);
    yPos += 40;
    
    // Payment Summary Section
    ctx.fillStyle = "#841584";
    ctx.font = "bold 14px Arial";
    ctx.fillText("Payment Summary", 30, yPos);
    yPos += 25;
    
    // Amount Box
    drawBox(30, yPos, width - 60, 65, "#fff9e6", "#f39c12");
    yPos += 12;
    
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 12px Arial";
    ctx.fillText("Amount:", 40, yPos);
    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`₹ ${parseFloat(bill.amount || 0).toFixed(2)}`, width - 40, yPos);
    ctx.textAlign = "left";
    yPos += 25;
    
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 12px Arial";
    ctx.fillText("Outstanding Balance:", 40, yPos);
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`₹ ${parseFloat(bill.outstanding || 0).toFixed(2)}`, width - 40, yPos);
    ctx.textAlign = "left";
    yPos += 35;
    
    // Total Balance (highlighted)
    drawLine(30, yPos - 5, width - 30, yPos - 5, "#841584", 2);
    yPos += 12;
    
    ctx.fillStyle = "#841584";
    ctx.font = "bold 14px Arial";
    ctx.fillText("Total Balance:", 40, yPos);
    ctx.fillStyle = "#841584";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`₹ ${parseFloat(bill.totalBalance || 0).toFixed(2)}`, width - 40, yPos);
    ctx.textAlign = "left";
    yPos += 40;
    
    // Footer
    drawLine(30, yPos, width - 30, yPos, "#ecf0f1");
    yPos += 20;
    
    ctx.fillStyle = "#7f8c8d";
    ctx.font = "italic 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Thank you for your business!", width / 2, yPos);
    yPos += 18;
    ctx.fillText("This is a computer-generated invoice. No signature required.", width / 2, yPos);
    
    // Convert canvas to image and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${bill.customerName}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Alert.alert("Success", "Invoice downloaded as image successfully");
    }, "image/png");
  };

  const handleDelete = () => {
    if (userRole === "viewer") {
      Alert.alert("Permission Denied", "You don't have permission to delete records");
      return;
    }
    Alert.alert(
      "Delete Records",
      `Are you sure you want to delete ${selectedRows.size} record(s)? This cannot be undone.`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: () => {
            deleteRowsFromSheet(selectedRows);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEdit = () => {
    if (userRole === "viewer") {
      Alert.alert("Permission Denied", "You don't have permission to edit records");
      return;
    }
    if (selectedRows.size !== 1) {
      Alert.alert("Edit", "Please select exactly one record to edit");
      return;
    }
    Alert.alert("Edit", "Edit functionality would be implemented here");
  };

  const handleView = () => {
    if (selectedRows.size !== 1) {
      Alert.alert("View", "Please select exactly one record to view");
      return;
    }
    Alert.alert("View", "View details functionality would be implemented here");
  };

  const renderRow = ({ item, index }) => {
    const isEditing = editingRowIndex === index;
    const displayValues = editedValues[index] || item;
    
    return (
      <View style={styles.row}>
        {userRole !== "viewer" && (
          <View style={styles.checkboxCell}>
            <TouchableOpacity
              onPress={() => {
                toggleRowSelection(index);
                // If unchecking during edit, cancel the edit
                if (editingRowIndex === index) {
                  setEditingRowIndex(null);
                  setEditedValues({});
                }
              }}
              style={[
                styles.checkbox,
                selectedRows.has(index) && styles.checkboxSelected,
              ]}
            >
              {selectedRows.has(index) && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>
        )}
        {item.map((cell, cellIndex) => (
          <View key={cellIndex} style={[styles.cellWrapper, isEditing && styles.editingCellWrapper]}>
            {isEditing ? (
              <TextInput
                style={styles.editingCell}
                value={displayValues[cellIndex]}
                onChangeText={(text) => {
                  setEditedValues({
                    ...editedValues,
                    [index]: [...displayValues].map((v, i) => (i === cellIndex ? text : v)),
                  });
                }}
                editable={!updating}
              />
            ) : (
              <Text style={styles.cell} numberOfLines={1}>{cell}</Text>
            )}
          </View>
        ))}
        {/* Bill Status Column */}
        <View style={[styles.cellWrapper, styles.billStatusCell]}>
          <Text style={styles.billStatusBadge}>📋 Ready</Text>
        </View>
        {userRole !== "viewer" && (
          <View style={styles.actionCell}>
            {isEditing ? (
              <TouchableOpacity
                onPress={() => updateSheetData([index], editedValues)}
                disabled={updating}
                style={styles.saveBtn}
                title="Accept"
              >
                <Text style={styles.actionCellBtnText}>✓</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => { setEditingRowIndex(index); setEditedValues({ [index]: item }); }}
                  style={styles.editActionBtn}
                >
                  <Text style={styles.actionCellBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => downloadBill(index)}
                  style={styles.downloadBtn}
                >
                  <Text style={styles.actionCellBtnText}>⬇️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        {userRole !== "viewer" && (
          <View style={styles.checkboxCell}>
            <TouchableOpacity
              onPress={selectAllRows}
              style={[
                styles.checkbox,
                selectedRows.size === sortedData.length && sortedData.length > 0 && styles.checkboxSelected,
              ]}
            >
              {selectedRows.size === sortedData.length && sortedData.length > 0 && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {headers.map((header, index) => (
          <TouchableOpacity
            key={index}
            style={styles.headerCell}
            onPress={() => {
              if (sortColumn === index) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortColumn(index);
                setSortOrder("asc");
              }
            }}
          >
            <Text style={styles.headerText}>{header}</Text>
            {sortColumn === index && <Text style={styles.sortIndicator}>{sortOrder === "asc" ? " ▲" : " ▼"}</Text>}
          </TouchableOpacity>
        ))}
        <View style={styles.billStatusHeaderCell}>
          <Text style={styles.headerText}>Bill Status</Text>
        </View>
        {userRole !== "viewer" && <View style={styles.actionHeaderCell}><Text style={styles.headerText}>Actions</Text></View>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with user info and sheet selector */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
      
          
          {/* Inline Sheet Selector */}
          {sheets.length > 0 && !loading && !error && (
            <View style={styles.inlineSheetSelector}>
              <Text style={styles.sheetLabel}>Sheet:</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowSheetDropdown(!showSheetDropdown)}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {selectedSheet || "Select Sheet"}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {showSheetDropdown ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              
              {showSheetDropdown && (
                <View style={styles.dropdownMenu}>
                  {sheets.map((sheet, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        selectedSheet === sheet.name && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedSheet(sheet.name);
                        setShowSheetDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedSheet === sheet.name && styles.dropdownItemTextSelected
                      ]}>
                        {sheet.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {selectedRows.size > 0 && !loading && !error && userRole !== "viewer" && (
        <View style={styles.actionToolbar}>
          <Text style={styles.selectionCount}>{selectedRows.size} record(s) selected</Text>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            disabled={updating}
          >
            <Text style={styles.actionBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#841584" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.includes("OFFICE_FILE") ? "⚠️ Office File Detected" : 
             error.includes("403") ? "🔒 Permission Denied" :
             "❌ Error"}
          </Text>
          <Text style={styles.helpText}>
            {error.includes("403") 
              ? `The API key doesn't have access to this sheet.\n\nQuick Fix:\n1. Open your Google Sheet\n2. Click "Share" (top right)\n3. Change to "Anyone with the link can view"\n4. Refresh this page\n\nOR keep it private:\n1. Create a Service Account in Google Cloud\n2. Add it to the sheet's sharing\n3. Use the service account JSON key`
              : error.includes("OFFICE_FILE") 
              ? `Your spreadsheet (${SPREADSHEET_ID}) is an Excel/Office file, not a native Google Sheet.\n\nSteps to fix:\n\n1. Open Google Drive (drive.google.com)\n2. Click "+ New" → "File upload"\n3. Upload your Excel file\n4. Right-click the file → "Open with" → "Google Sheets"\n5. Wait for conversion to complete\n6. Copy the NEW Sheet ID from the URL\n7. Update SPREADSHEET_ID in Dashboard.js\n8. Refresh the page`
              : `${error}\n\nMake sure:\n• The spreadsheet is a native Google Sheet\n• The API key is valid\n• Google Sheets API is enabled\n• The sheet is shared publicly`
            }
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchSheetNames}>
            <Text style={styles.retryBtnText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !selectedSheet ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No Sheet Selected</Text>
          <Text style={styles.emptyStateMessage}>Please select a sheet from the dropdown to view data</Text>
        </View>
      ) : headers.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>No Data Available</Text>
          <Text style={styles.emptyStateMessage}>This sheet is empty. Add data to the sheet and click 'Refresh' to see it here.</Text>
          <TouchableOpacity
            style={styles.emptyStateRefreshBtn}
            onPress={() => selectedSheet && fetchSheetData(selectedSheet)}
          >
            <Text style={styles.emptyStateRefreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : sheetData.length > 0 ? (
        <View style={styles.tableWrapper}>
          {/* Search and Pagination Top Bar */}
          <View style={styles.paginationTopBar}>
            {/* Single Row: Search Input + Rows Per Page + Refresh + Stats */}
            <View style={styles.paginationTopBarRow}>
              {/* Search Input - Fits table width */}
              <View style={styles.gridSearchContainer}>
                <TextInput
                  style={styles.gridSearchInput}
                  placeholder="🔍 Search by customer name..."
                  placeholderTextColor="#7f8c8d"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Rows Per Page Controls */}
              <View style={styles.rowsPerPageContainer}>
                <Text style={styles.rowsPerPageLabel}>Rows per page:</Text>
                {[10, 20, 50].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.rowsPerPageBtn,
                      rowsPerPage === size && styles.rowsPerPageBtnActive
                    ]}
                    onPress={() => {
                      setRowsPerPage(size);
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={[
                      styles.rowsPerPageBtnText,
                      rowsPerPage === size && styles.rowsPerPageBtnTextActive
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Refresh Button */}
              <TouchableOpacity
                style={styles.refreshButtonSmall}
                onPress={() => selectedSheet && fetchSheetData(selectedSheet)}
              >
                <Text style={styles.refreshButtonTextSmall}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRowContainer}>
              <Text style={styles.totalCountText}>
                Total: {sortedData.length} | Showing: {startIndex + 1}-{endIndex}
              </Text>
            </View>
          </View>

          {/* Responsive Table */}
          <ScrollView 
            style={styles.tableContainer} 
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
            scrollIndicatorInsets={{ right: 0 }}
          >
            <View>
              {renderHeader()}
              <FlatList
                data={paginatedData}
                renderItem={(props) => renderRow({ ...props, index: startIndex + props.index })}
                keyExtractor={(item, index) => `${currentPage}-${index}`}
                style={styles.list}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>

          {/* Pagination Controls */}
          <View style={styles.paginationBar}>
            <TouchableOpacity
              style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationBtnText}>← Previous</Text>
            </TouchableOpacity>

            <View style={styles.pageInfoContainer}>
              <Text style={styles.pageInfoText}>
                Page {currentPage} of {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]}
              onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📭</Text>
          <Text style={styles.emptyStateTitle}>No Records Found</Text>
          <Text style={styles.emptyStateMessage}>The search didn't match any records. Try adjusting your search criteria.</Text>
          <TouchableOpacity
            style={styles.emptyStateClearBtn}
            onPress={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
          >
            <Text style={styles.emptyStateClearBtnText}>✕ Clear Search</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f8f9fa",
  },
  
  // Header styles
  header: {
    backgroundColor: "#2c3e50",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
    overflow: "visible",
  },
  headerLeft: {
    flex: 1,
    gap: 10,
    position: "relative",
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  roleText: {
    fontSize: 11,
    color: "#bdc3c7",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Inline Sheet Selector Styles
  inlineSheetSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    position: "relative",
    zIndex: 100,
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    minWidth: "auto",
    marginRight: 4,
  },
  dropdownButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#841584",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 160,
    maxWidth: 200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownButtonText: {
    color: "#2c3e50",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  dropdownArrow: {
    color: "#841584",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  dropdownMenu: {
    position: "absolute",
    top: 48,
    left: 0,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#841584",
    zIndex: 1001,
    minWidth: 200,
    maxHeight: 320,
    shadowColor: "#841584",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    backgroundColor: "#fff",
  },
  dropdownItemSelected: {
    backgroundColor: "#f4ebf8",
    borderBottomColor: "#d4a5e1",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "500",
  },
  dropdownItemTextSelected: {
    color: "#841584",
    fontWeight: "700",
  },

  logoutBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  // Title styles
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 16,
    color: "#2c3e50",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  // Toolbar styles
  toolbar: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e6ed",
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: "#f0f2f5",
    borderWidth: 1,
    borderColor: "#e0e6ed",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#2c3e50",
  },
  filterBtn: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  refreshBtn: {
    backgroundColor: "#27ae60",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  refreshBtnText: {
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e6ed",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#2c3e50",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: "#7f8c8d",
    fontWeight: "600",
    textAlign: "center",
  },
  applyBtn: {
    flex: 1,
    backgroundColor: "#841584",
    paddingVertical: 12,
    borderRadius: 6,
  },
  applyBtnText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },

  // Action toolbar styles
  actionToolbar: {
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e6ed",
  },
  selectionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  // Stats bar styles
  statsBar: {
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e6ed",
  },
  statText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
  },

  // Table wrapper and pagination styles
  tableWrapper: {
    flex: 1,
    flexDirection: "column",
  },

  paginationTopBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "column",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e6ed",
  },

  paginationTopBarRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
  },

  statsRowContainer: {
    paddingHorizontal: 2,
  },

  gridSearchContainer: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderWidth: 1,
    borderColor: "#e0e6ed",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },

  gridSearchInput: {
    fontSize: 13,
    color: "#2c3e50",
    padding: 0,
    flex: 1,
  },

  rowsPerPageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    minWidth: "auto",
  },

  rowsPerPageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },

  rowsPerPageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#bdc3c7",
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  rowsPerPageBtnActive: {
    backgroundColor: "#841584",
    borderColor: "#841584",
  },

  rowsPerPageBtnText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#2c3e50",
  },

  rowsPerPageBtnTextActive: {
    color: "#fff",
  },

  refreshButtonSmall: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  refreshButtonTextSmall: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  totalCountText: {
    fontSize: 11,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // Table styles
  tableContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    minHeight: 200,
  },
  tableContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#2c3e50",
    borderBottomWidth: 2,
    borderBottomColor: "#1a252f",
  },
  headerCell: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontWeight: "700",
    borderRightWidth: 1,
    borderRightColor: "#34495e",
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  sortIndicator: {
    color: "#f39c12",
    marginLeft: 4,
  },
  
  // Row and cell styles
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  cellWrapper: {
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: "#ecf0f1",
  },
  editingCellWrapper: {
    backgroundColor: "#fffbea",
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "#2c3e50",
    fontSize: 12,
  },
  editingCell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: "#2c3e50",
    fontSize: 12,
    backgroundColor: "#fffbea",
    borderWidth: 1,
    borderColor: "#f39c12",
  },

  // Checkbox styles
  checkboxCell: {
    width: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ecf0f1",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#bdc3c7",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#841584",
    borderColor: "#841584",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  
  // Action cell styles
  actionCell: {
    width: 80,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: "#ecf0f1",
  },
  actionHeaderCell: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: "#34495e",
  },
  editActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#f39c12",
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCellBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Bill Status styles
  billStatusCell: {
    minWidth: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  billStatusHeaderCell: {
    minWidth: 140,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: "#34495e",
  },
  billStatusBadge: {
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#27ae60",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    textAlign: "center",
  },

  // Error and empty state styles
  errorContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ecf0f1",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  helpText: {
    color: "#7f8c8d",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: "#841584",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginVertical: 20,
    fontWeight: "500",
  },

  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },

  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyStateMessage: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
    maxWidth: 320,
  },

  emptyStateRefreshBtn: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },

  emptyStateRefreshBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  emptyStateClearBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },

  emptyStateClearBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  // Pagination bar styles
  paginationBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e6ed",
  },

  paginationBtn: {
    backgroundColor: "#841584",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },

  paginationBtnDisabled: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },

  paginationBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  pageInfoContainer: {
    paddingHorizontal: 10,
  },

  pageInfoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },
  
  list: {
    // Removed maxHeight: 400 to allow dynamic scrolling based on pagination size
  },
});

export default Dashboard;
