import fs from 'fs';
import path from 'path';
import * as pdfjsLib from './node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import { PhonePeParser } from './src/features/statementImport/parsers/phonePeParser.ts';
import { BankStatementParser } from './src/features/statementImport/parsers/bankStatementParser.ts';
import { StatementParserRegistry } from './src/features/statementImport/parsers/statementDetector.ts';
import { detectDuplicates } from './src/features/statementImport/services/duplicateDetector.ts';
import { mapToCategory } from './src/features/statementImport/utils/categoryMapper.ts';

async function runVerification() {
  console.log('====================================================');
  console.log('  ExpenseIQ Statement Import Verification Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Category Mapping
  console.log('--- Test Group 1: Category Mapping ---');
  const swiggy = mapToCategory('Paid to Swiggy Bangalore', 'Swiggy');
  assert(swiggy.category === 'Food & Dining' && swiggy.subCategory === 'Food Delivery', 'Swiggy -> Food & Dining (Food Delivery)');

  const hpcl = mapToCategory('HPCL Petrol Pump Mumbai', 'HPCL');
  assert(hpcl.category === 'Transportation' && hpcl.subCategory === 'Petrol', 'HPCL -> Transportation (Petrol)');

  const amazon = mapToCategory('Amazon Pay India Marketplace', 'Amazon');
  assert(amazon.category === 'Shopping' && amazon.subCategory === 'Online Shopping', 'Amazon -> Shopping (Online Shopping)');

  const netflix = mapToCategory('Netflix Entertainment Subscription', 'Netflix');
  assert(netflix.category === 'Entertainment' && netflix.subCategory === 'Subscription', 'Netflix -> Entertainment (Subscription)');

  const unk = mapToCategory('Random Corner Kirana Store');
  assert(unk.category === 'Uncategorized', 'Unknown merchant -> Uncategorized');

  // TEST 2: Unprotected PhonePe PDF Extraction & Parsing
  console.log('\n--- Test Group 2: PhonePe Statement Parsing ---');
  const phonePeBuf = fs.readFileSync('./public/sample-statements/sample_phonepe_statement.pdf');
  const phonePeDoc = await pdfjsLib.getDocument({ data: new Uint8Array(phonePeBuf), password: '' }).promise;
  const phonePePage = await phonePeDoc.getPage(1);
  const phonePeContent = await phonePePage.getTextContent();
  const phonePeText = phonePeContent.items.map(i => i.str).join('\n');

  const detectedPhonePeParser = StatementParserRegistry.detectParser(phonePeText, 'PhonePe_Sept_Statement.pdf');
  assert(detectedPhonePeParser instanceof PhonePeParser, 'PhonePe parser auto-detected from PDF content');

  const phonePeResult = detectedPhonePeParser.parse(phonePeText, [phonePeText]);
  assert(phonePeResult.transactions.length >= 5, `Extracted ${phonePeResult.transactions.length} transactions from PhonePe`);

  const foundSwiggy = phonePeResult.transactions.find(t => t.merchant === 'Swiggy' || t.description.includes('Swiggy'));
  assert(Boolean(foundSwiggy && foundSwiggy.amount === 420), 'Swiggy transaction found with exact amount ₹420');

  const foundSalary = phonePeResult.transactions.find(t => t.amount === 75000 && t.type === 'credit');
  assert(Boolean(foundSalary), 'TechCorp salary credit found with ₹75,000');

  // TEST 3: Duplicate Detection
  console.log('\n--- Test Group 3: Duplicate Detection ---');
  const existingMockTransactions = [
    {
      id: 'existing_tx_1',
      userId: 'user_1',
      date: '2026-09-16',
      description: 'Paid to Amazon',
      amount: 1299,
      type: 'debit',
      category: 'Shopping',
      referenceId: 'T2609161645556677',
      createdAt: '2026-09-16T16:45:00Z',
    }
  ];

  const dedupeResult = detectDuplicates(phonePeResult.transactions, existingMockTransactions);
  assert(dedupeResult.duplicateCount === 1, `Detected exactly 1 duplicate (expected 1, got ${dedupeResult.duplicateCount})`);
  assert(dedupeResult.newCount === phonePeResult.transactions.length - 1, `Correct new count: ${dedupeResult.newCount}`);

  const duplicateTx = dedupeResult.transactions.find(t => t.isDuplicate);
  assert(duplicateTx && duplicateTx.isSelected === false, 'Duplicate transaction is automatically deselected by default');

  // TEST 4: Password-Protected Statement Detection & Decryption
  console.log('\n--- Test Group 4: Password Protected PDF Handling ---');
  const protectedBuf = fs.readFileSync('./public/sample-statements/sample_bank_statement_protected.pdf');
  const protectedData = new Uint8Array(protectedBuf);

  // 4a. Verify it rejects empty/no password
  let passwordRequired = false;
  try {
    await pdfjsLib.getDocument({ data: protectedData, password: '' }).promise;
  } catch (err) {
    if (err.name === 'PasswordException') passwordRequired = true;
  }
  assert(passwordRequired, 'PasswordException triggered when opening protected PDF with empty password');

  // 4b. Verify it rejects incorrect password
  let wrongPasswordError = false;
  try {
    await pdfjsLib.getDocument({ data: protectedData, password: 'wrongpassword' }).promise;
  } catch (err) {
    if (err.name === 'PasswordException') wrongPasswordError = true;
  }
  assert(wrongPasswordError, 'PasswordException triggered on wrong password attempt');

  // 4c. Verify it unlocks successfully with correct password
  let unlocked = false;
  let bankText = '';
  try {
    const bankDoc = await pdfjsLib.getDocument({ data: protectedData, password: 'statement123' }).promise;
    unlocked = true;
    const p1 = await bankDoc.getPage(1);
    const tc = await p1.getTextContent();
    bankText = tc.items.map(i => i.str).join('\n');
  } catch (err) {
    console.error(err);
  }
  assert(unlocked, 'Successfully decrypted and unlocked PDF with password "statement123"');

  // 4d. Verify bank statement parsing on the decrypted content
  const bankParser = StatementParserRegistry.detectParser(bankText, 'HDFC_Protected_Statement.pdf');
  assert(bankParser instanceof BankStatementParser, 'Bank Statement Parser auto-detected for decrypted statement');

  const bankResult = bankParser.parse(bankText, [bankText]);
  assert(bankResult.transactions.length >= 4, `Extracted ${bankResult.transactions.length} transactions from HDFC bank statement`);

  const hdfcSwiggy = bankResult.transactions.find(t => t.description.includes('SWIGGY') && t.amount === 420);
  assert(Boolean(hdfcSwiggy), 'Extracted POS SWIGGY ₹420 from tabular bank statement');

  console.log('\n====================================================');
  console.log(`  Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
