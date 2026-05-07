/**
 * Invoice/Bill View Component
 * 
 * Generates a clean, printable invoice that can be captured as an image
 * for WhatsApp delivery via Meta Cloud API
 * 
 * Props:
 *   - customerId: string
 *   - customerName: string
 *   - customerPhone: string
 *   - orderId: string
 *   - items: Array<{name: string, quantity: number, price: number}>
 *   - totalAmount: number
 *   - companyName: string
 *   - companyPhone: string
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ViewShot from 'react-native-view-shot';

const InvoiceView = ({
  customerId,
  customerName,
  customerPhone,
  orderId,
  items = [],
  totalAmount = 0,
  companyName = 'Your Company',
  companyPhone = '+1234567890',
  onSendViaWhatsApp,
}) => {
  const viewShotRef = useRef(null);
  const [loading, setLoading] = React.useState(false);

  /**
   * Capture invoice view as PNG image
   * Returns image URI for upload
   */
  const captureInvoiceImage = async () => {
    try {
      setLoading(true);
      const uri = await viewShotRef.current.capture();
      console.log('✅ Invoice captured:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Failed to capture invoice:', error);
      Alert.alert('Error', 'Failed to capture invoice image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle send via WhatsApp
   * 1. Capture invoice as image
   * 2. Upload to backend
   * 3. Backend sends via WhatsApp Cloud API
   */
  const handleSendWhatsApp = async () => {
    if (!customerPhone) {
      Alert.alert('Error', 'Customer phone number is required');
      return;
    }

    const imageUri = await captureInvoiceImage();
    if (!imageUri) return;

    try {
      setLoading(true);
      await onSendViaWhatsApp({
        customerId,
        customerName,
        customerPhone,
        orderId,
        totalAmount,
        imageUri,
      });
      Alert.alert('Success', 'Invoice sent via WhatsApp!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2);
  };

  return (
    <ScrollView style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
        {/* Invoice Background */}
        <View style={styles.invoice}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyPhone}>{companyPhone}</Text>
          </View>

          <View style={styles.divider} />

          {/* Invoice Title */}
          <View style={styles.invoiceTitle}>
            <Text style={styles.titleText}>📋 INVOICE</Text>
            <Text style={styles.orderIdText}>Order #{orderId}</Text>
          </View>

          {/* Customer Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.customerPhone}>{customerPhone}</Text>
          </View>

          {/* Items Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.itemColumn]}>Item</Text>
            <Text style={[styles.tableCell, styles.quantityColumn]}>Qty</Text>
            <Text style={[styles.tableCell, styles.priceColumn]}>Price</Text>
            <Text style={[styles.tableCell, styles.amountColumn]}>Amount</Text>
          </View>

          {/* Items List */}
          {items.length > 0 ? (
            items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.itemColumn]}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.quantityColumn]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.priceColumn]}>₹{item.price.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.amountColumn]}>
                  ₹{(item.quantity * item.price).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.emptyText}>No items</Text>
            </View>
          )}

          {/* Total Section */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₹{calculateTotal()}</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerText}>This is an automated invoice. Please do not reply to this message.</Text>
          </View>
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.whatsappButton]}
          onPress={handleSendWhatsApp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>💬 Send via WhatsApp</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={captureInvoiceImage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💾 Save Image</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  invoice: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  companyPhone: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  invoiceTitle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orderIdText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  tableCell: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  itemColumn: {
    flex: 2,
  },
  quantityColumn: {
    flex: 1,
    textAlign: 'center',
  },
  priceColumn: {
    flex: 1,
    textAlign: 'right',
  },
  amountColumn: {
    flex: 1,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  saveButton: {
    backgroundColor: '#0066cc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InvoiceView;
