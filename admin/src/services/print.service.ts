import { Platform, Alert } from 'react-native';

/**
 * Print Service
 * Handles printing functionality for admin app (receipts, reports, etc.)
 */

class PrintService {
  /**
   * Print receipt/order details
   * @param {object} orderData - Order data to print
   * @returns {Promise<boolean>} Success status
   */
  async printReceipt(orderData: any): Promise<boolean> {
    try {
      console.log('Printing receipt for order:', orderData);

      // Format receipt data
      const receiptContent = this.formatReceipt(orderData);

      // Use native printing module (React Native Print or similar)
      // For now, just logging
      console.log('Receipt content:', receiptContent);

      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Print Error', 'Failed to print receipt');
      return false;
    }
  }

  /**
   * Format receipt content
   * @param {object} orderData - Order data
   * @returns {string} Formatted receipt
   */
  formatReceipt(orderData: any): string {
    const {
      orderId,
      customerName,
      workerName,
      services,
      totalAmount,
      date,
      status
    } = orderData;

    return `
      ========================================
                 CLICKSOLVER RECEIPT
      ========================================

      Order ID: ${orderId}
      Date: ${new Date(date).toLocaleString()}
      Status: ${status}

      Customer: ${customerName}
      Worker: ${workerName}

      Services:
      ${services?.map((s: any) => `  - ${s.name}: ₹${s.price}`).join('\n')}

      ----------------------------------------
      Total Amount: ₹${totalAmount}
      ----------------------------------------

      Thank you for using ClickSolver!
      ========================================
    `;
  }

  /**
   * Print report
   * @param {object} reportData - Report data to print
   * @returns {Promise<boolean>} Success status
   */
  async printReport(reportData: any): Promise<boolean> {
    try {
      console.log('Printing report:', reportData);

      // Format report data
      const reportContent = this.formatReport(reportData);

      console.log('Report content:', reportContent);

      return true;
    } catch (error) {
      console.error('Error printing report:', error);
      Alert.alert('Print Error', 'Failed to print report');
      return false;
    }
  }

  /**
   * Format report content
   * @param {object} reportData - Report data
   * @returns {string} Formatted report
   */
  formatReport(reportData: any): string {
    const { title, data, generatedDate } = reportData;

    return `
      ========================================
               ${title}
      ========================================

      Generated: ${new Date(generatedDate).toLocaleString()}

      ${JSON.stringify(data, null, 2)}

      ========================================
    `;
  }

  /**
   * Check if printing is available
   * @returns {Promise<boolean>} Availability status
   */
  async isPrintingAvailable(): Promise<boolean> {
    try {
      // Check if printing module is available
      // For now, return true
      return true;
    } catch (error) {
      console.error('Error checking print availability:', error);
      return false;
    }
  }

  /**
   * Print worker summary
   * @param {object} workerData - Worker data
   * @returns {Promise<boolean>} Success status
   */
  async printWorkerSummary(workerData: any): Promise<boolean> {
    try {
      console.log('Printing worker summary:', workerData);

      const summaryContent = this.formatWorkerSummary(workerData);
      console.log('Worker summary:', summaryContent);

      return true;
    } catch (error) {
      console.error('Error printing worker summary:', error);
      return false;
    }
  }

  /**
   * Format worker summary
   * @param {object} workerData - Worker data
   * @returns {string} Formatted summary
   */
  formatWorkerSummary(workerData: any): string {
    const {
      name,
      phone,
      rating,
      totalServices,
      pendingBalance,
      pendingCashback,
      date
    } = workerData;

    return `
      ========================================
              WORKER SUMMARY
      ========================================

      Name: ${name}
      Phone: ${phone}
      Rating: ${rating}/5.0

      Total Services: ${totalServices}
      Pending Balance: ₹${pendingBalance}
      Pending Cashback: ₹${pendingCashback}

      Report Date: ${new Date(date).toLocaleString()}

      ========================================
    `;
  }
}

const printService = new PrintService();
export default printService;
