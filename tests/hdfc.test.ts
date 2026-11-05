/**
 * HDFC SmartGateway: status mapping, field mapping and the return signature.
 * Nothing here talks to the bank; the live calls are exercised on UAT.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { HdfcService, normaliseHdfcStatus, orderToGatewayFields } from '@/lib/services/hdfc';

test('only CHARGED counts as paid', () => {
    assert.equal(normaliseHdfcStatus('CHARGED'), 'success');
    assert.equal(normaliseHdfcStatus(' charged '), 'success');
});

test('final failures are failed; in-flight and unknown states stay unresolved', () => {
    for (const s of ['AUTHENTICATION_FAILED', 'AUTHORIZATION_FAILED', 'JUSPAY_DECLINED']) {
        assert.equal(normaliseHdfcStatus(s), 'failed', s);
    }
    for (const s of ['NEW', 'STARTED', 'PENDING_VBV', 'AUTHORIZING', 'SOMETHING_NEW', '', null, undefined]) {
        assert.equal(normaliseHdfcStatus(s as string), 'unresolved', String(s));
    }
});

test('an order maps onto the field names the shared outcome code reads', () => {
    const fields = orderToGatewayFields({
        status: 'CHARGED',
        amount: 1500,
        txn_id: 'OL1ABC-1',
        payment_method_type: 'UPI',
        payment_method: 'UPI',
        payment_gateway_response: { rrn: '123456789012' },
        txn_detail: { error_message: '' },
    });
    assert.equal(fields.amount, '1500');
    assert.equal(fields.easepayid, 'OL1ABC-1');
    assert.equal(fields.bank_ref_num, '123456789012');
    assert.equal(fields.payment_source, 'hdfc_upi');
    assert.equal('error_Message' in fields, false, 'empty values are dropped');
});

test('a failed order carries the bank reason for the failure page', () => {
    const fields = orderToGatewayFields({
        status: 'AUTHORIZATION_FAILED',
        amount: 10,
        txn_detail: { error_message: 'Insufficient funds' },
    });
    assert.equal(fields.error_Message, 'Insufficient funds');
    assert.equal(fields.payment_source, 'hdfc');
});

test('return signature: accepts a correct HMAC, rejects a tampered one', () => {
    process.env.HDFC_RESPONSE_KEY = 'unit-test-response-key';
    const params = { order_id: 'OL1ABC', status: 'CHARGED', status_id: '21' };

    const enc = encodeURIComponent;
    const joined = Object.keys(params).sort().map((k) => `${enc(k)}=${enc(params[k as keyof typeof params])}`).join('&');
    const signature = crypto.createHmac('sha256', process.env.HDFC_RESPONSE_KEY).update(enc(joined)).digest('hex');

    assert.equal(HdfcService.verifyReturnSignature({ ...params, signature, signature_algorithm: 'HMAC-SHA256' }), true);
    assert.equal(HdfcService.verifyReturnSignature({ ...params, status: 'FAILED', signature }), false);
    assert.equal(HdfcService.verifyReturnSignature(params), false, 'no signature at all');
});

test('not configured until the API key, merchant id and response key are all set', () => {
    for (const k of ['HDFC_API_KEY', 'HDFC_MERCHANT_ID', 'HDFC_RESPONSE_KEY']) delete process.env[k];
    assert.equal(HdfcService.isConfigured, false);
    process.env.HDFC_API_KEY = 'a';
    process.env.HDFC_MERCHANT_ID = 'm';
    assert.equal(HdfcService.isConfigured, false);
    process.env.HDFC_RESPONSE_KEY = 'r';
    assert.equal(HdfcService.isConfigured, true);
});
