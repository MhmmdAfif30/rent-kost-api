const axios = require('axios');
const https = require('https');

class MidtransHelper {
    constructor() {
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 100,
            maxFreeSockets: 10,
            timeout: 300000 // 5 menit
        });
        
        this.axiosInstance = axios.create({
            timeout: 180000,
            httpsAgent: this.httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Connection': 'keep-alive'
            }
        });
    }
    
    async createTransactionWithRetry(params, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.createTransactionWithTimeout(params, 60000);
                return result;
                
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                const waitTime = attempt * 5000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        throw lastError;
    }
    
    async createTransactionWithTimeout(params, timeoutMs = 60000) {
        const abortController = new AbortController();
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                abortController.abort();
                reject(new Error(`Midtrans timeout after ${timeoutMs}ms`));
            }, timeoutMs);
        });
        
        const transactionPromise = this.createTransaction(params, abortController.signal);
        
        return Promise.race([transactionPromise, timeoutPromise]);
    }
    
    async createTransaction(params, signal = null) {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) {
            throw new Error('MIDTRANS_SERVER_KEY is not configured');
        }
        
        const authString = Buffer.from(serverKey + ':').toString('base64');
        
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'false';
        const apiUrl = isProduction 
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
        
        const startTime = Date.now();
        
        try {
            const response = await this.axiosInstance.post(apiUrl, params, {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json'
                },
                signal: signal,
                timeout: 0
            });
            
            const duration = Date.now() - startTime;
            console.log(`⏱️ Midtrans response received in ${duration}ms`);
            
            if (!response.data || !response.data.token) {
                throw new Error('Invalid response from Midtrans: missing token');
            }
            
            return response.data;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`Midtrans error after ${duration} ms:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            
            if (error.code === 'ABORT_ERR' || error.name === 'AbortError') {
                throw new Error('Request aborted due to timeout');
            }
            
            throw error;
        }
    }
    
    async getTransactionStatus(orderId) {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const authString = Buffer.from(serverKey + ':').toString('base64');
        
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        const apiUrl = isProduction 
            ? `https://api.midtrans.com/v2/${orderId}/status`
            : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;
        
        const response = await this.axiosInstance.get(apiUrl, {
            headers: {
                'Authorization': `Basic ${authString}`
            },
            timeout: 30000
        });
        
        return response.data;
    }
    
    async handleNotification(notificationData) {
        try {
            const orderId = notificationData.order_id;
            const status = await this.getTransactionStatus(orderId);
            
            return {
                order_id: orderId,
                transaction_status: status.transaction_status,
                fraud_status: status.fraud_status,
                payment_type: status.payment_type,
                gross_amount: status.gross_amount
            };
        } catch (error) {
            console.error('Handle Notification Error:', error);
            throw error;
        }
    }
}

module.exports = new MidtransHelper();