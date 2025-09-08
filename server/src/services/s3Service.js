import AWS from 'aws-sdk';
import { logger } from '../utils/logger.js';

class S3Service {
  constructor() {
    this.s3 = null;
    this.bucketName = process.env.S3_BUCKET_NAME;
    
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      
      this.s3 = new AWS.S3();
    } else {
      logger.warn('AWS credentials not found, S3 service disabled');
    }
  }

  async isAvailable() {
    if (!this.s3 || !this.bucketName) {
      return false;
    }
    
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      return true;
    } catch (error) {
      logger.error('S3 service not available:', error.message);
      return false;
    }
  }

  async uploadReport(runId, reportType, reportData) {
    if (!this.s3 || !this.bucketName) {
      throw new Error('S3 service not configured');
    }

    try {
      const key = `reports/${runId}/${reportType}-${Date.now()}.json`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(reportData, null, 2),
        ContentType: 'application/json',
        ACL: 'private'
      };

      const result = await this.s3.upload(params).promise();
      
      logger.info(`Report uploaded to S3: ${result.Location}`);
      return {
        url: result.Location,
        key: key,
        bucket: this.bucketName
      };
    } catch (error) {
      logger.error('Error uploading report to S3:', error);
      throw new Error(`Failed to upload report: ${error.message}`);
    }
  }

  async uploadFile(runId, fileName, fileContent, contentType = 'text/plain') {
    if (!this.s3 || !this.bucketName) {
      throw new Error('S3 service not configured');
    }

    try {
      const key = `files/${runId}/${fileName}`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        ACL: 'private'
      };

      const result = await this.s3.upload(params).promise();
      
      logger.info(`File uploaded to S3: ${result.Location}`);
      return {
        url: result.Location,
        key: key,
        bucket: this.bucketName
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key) {
    if (!this.s3 || !this.bucketName) {
      throw new Error('S3 service not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async generateSignedUrl(key, expiresIn = 3600) {
    if (!this.s3 || !this.bucketName) {
      throw new Error('S3 service not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }
}

export default new S3Service();
