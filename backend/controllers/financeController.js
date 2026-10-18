/** Finance operations for fee definitions, invoices, payments, and student balances. */
const db = require('../config/db');
const generateReceiptNumber = require('../utils/generateReceiptNumber');
const validId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;
const periods = (body) => typeof body.academic_year === 'string' && !!body.academic_year.trim() && body.academic_year.length <= 10 && ['I', 'II', 'Summer'].includes(body.semester);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;

exports.listFees = async (req, res, next) => { try { const [r] = await db.query('SELECT * FROM fee_types ORDER BY academic_year DESC,semester,fee_name'); res.json(r); } catch (e) { next(e); } };
exports.createFee = async (req, res, next) => {
  try {
    const { fee_name, fee_category, amount, academic_year, semester, is_mandatory } = req.body;
    if (typeof fee_name !== 'string' || !fee_name.trim() || fee_name.length > 100 || !['tuition','dormitory','library','registration','other'].includes(fee_category) || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !periods(req.body)) return res.status(400).json({ message: 'Enter valid fee details' });
    const [r] = await db.query('INSERT INTO fee_types (fee_name,fee_category,amount,academic_year,semester,is_mandatory) VALUES (?,?,?,?,?,?)', [fee_name.trim(),fee_category,Number(amount),academic_year,semester,is_mandatory === false ? 0 : 1]);
    res.status(201).json({ fee_id: r.insertId, message: 'Fee type created' });
  } catch (e) { next(e); }
};
exports.updateFee = async (req, res, next) => {
  try {
    const { fee_name, fee_category, amount, academic_year, semester, is_mandatory } = req.body;
    if (!validId(req.params.id) || typeof fee_name !== 'string' || !fee_name.trim() || fee_name.length > 100 || !['tuition','dormitory','library','registration','other'].includes(fee_category) || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !periods(req.body)) return res.status(400).json({ message: 'Enter valid fee details' });
    const [r] = await db.query('UPDATE fee_types SET fee_name=?,fee_category=?,amount=?,academic_year=?,semester=?,is_mandatory=? WHERE fee_id=?', [fee_name.trim(),fee_category,Number(amount),academic_year,semester,is_mandatory === false ? 0 : 1,req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Fee type not found' }); res.json({ message: 'Fee type updated' });
  } catch (e) { next(e); }
};
exports.deleteFee = async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid fee id' }); const [r] = await db.query('DELETE FROM fee_types WHERE fee_id=?', [req.params.id]); if (!r.affectedRows) return res.status(404).json({ message: 'Fee type not found' }); res.json({ message: 'Fee type deleted' }); } catch (e) { if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Fee type is already used by an invoice' }); next(e); } };

exports.listInvoices = async (req, res, next) => {
  try {
    const where = []; const params = [];
    if (req.query.status && !['Unpaid','Partial','Paid','Waived','Overdue'].includes(req.query.status)) return res.status(400).json({ message:'Invalid invoice status' });
    if (req.query.status === 'Overdue') where.push("i.due_date < CURDATE() AND i.status IN ('Unpaid','Partial','Overdue')");
    else if (req.query.status) { where.push('i.status=?'); params.push(req.query.status); }
    if (req.query.department_id) { if (!validId(req.query.department_id)) return res.status(400).json({ message: 'Invalid department id' }); where.push('s.department_id=?'); params.push(req.query.department_id); }
    if (req.query.academic_year) { if (typeof req.query.academic_year !== 'string' || req.query.academic_year.length > 10) return res.status(400).json({message:'Invalid academic year'}); where.push('i.academic_year=?'); params.push(req.query.academic_year); }
    if (req.query.student_id) { if (!validId(req.query.student_id)) return res.status(400).json({ message: 'Invalid student id' }); where.push('i.student_id=?'); params.push(req.query.student_id); }
    const [rows] = await db.query(`SELECT i.*,CASE WHEN i.due_date<CURDATE() AND i.status IN ('Unpaid','Partial','Overdue') THEN 'Overdue' ELSE i.status END AS current_status,f.fee_name,f.fee_category,f.is_mandatory,s.student_number,s.first_name,s.last_name,d.department_name
      FROM student_invoices i JOIN fee_types f ON f.fee_id=i.fee_id JOIN students s ON s.student_id=i.student_id
      LEFT JOIN departments d ON d.department_id=s.department_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY i.issued_at DESC`, params);
    res.json(rows);
  } catch (e) { next(e); }
};
exports.createInvoice = async (req, res, next) => {
  try {
    const { student_id, fee_id, academic_year, semester, amount_due, due_date } = req.body;
    if (!validId(student_id) || !validId(fee_id) || !periods(req.body) || !Number.isFinite(Number(amount_due)) || Number(amount_due) <= 0 || (due_date && !validDate(due_date))) return res.status(400).json({ message: 'Enter valid invoice details' });
    const [[target]] = await db.query('SELECT s.student_id,f.fee_id FROM students s CROSS JOIN fee_types f WHERE s.student_id=? AND f.fee_id=?', [student_id,fee_id]);
    if (!target) return res.status(400).json({ message:'Choose an existing student and fee type' });
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
    const [r] = await db.query('INSERT INTO student_invoices (invoice_number,student_id,fee_id,academic_year,semester,amount_due,due_date) VALUES (?,?,?,?,?,?,?)', [invoiceNumber,student_id,fee_id,academic_year,semester,Number(amount_due),due_date || null]);
    res.status(201).json({ invoice_id:r.insertId,invoice_number:invoiceNumber,message:'Invoice created' });
  } catch (e) { next(e); }
};
exports.bulkInvoices = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { department_id, fee_id, academic_year, semester, due_date } = req.body;
    if (!validId(department_id) || !validId(fee_id) || !periods(req.body) || (due_date && !validDate(due_date))) return res.status(400).json({ message: 'Enter valid bulk invoice details' });
    await conn.beginTransaction();
    const [[fee]] = await conn.query('SELECT amount,academic_year,semester FROM fee_types WHERE fee_id=? FOR UPDATE', [fee_id]);
    if (!fee) { await conn.rollback(); return res.status(404).json({ message:'Fee type not found' }); }
    const [[department]] = await conn.query('SELECT department_id FROM departments WHERE department_id=?', [department_id]);
    if (!department) { await conn.rollback(); return res.status(400).json({ message:'Department not found' }); }
    if (fee.academic_year !== academic_year || fee.semester !== semester) { await conn.rollback(); return res.status(400).json({ message:'Fee type academic year and semester must match the invoice period' }); }
    const [students] = await conn.query("SELECT student_id FROM students WHERE department_id=? AND status='Active' ORDER BY student_id", [department_id]);
    let count = 0;
    for (const s of students) {
      const n = `INV-${Date.now()}-${s.student_id}-${Math.floor(Math.random()*1000)}`;
      const [r] = await conn.query(`INSERT IGNORE INTO student_invoices (invoice_number,student_id,fee_id,academic_year,semester,amount_due,due_date)
        VALUES (?,?,?,?,?,?,?)`, [n,s.student_id,fee_id,academic_year,semester,fee.amount,due_date || null]); count += r.affectedRows;
    }
    await conn.commit(); res.status(201).json({ created:count,message:`Created ${count} invoices` });
  } catch (e) { await conn.rollback(); next(e); } finally { conn.release(); }
};
exports.invoiceDetail = async (req, res, next) => {
  try { if (!validId(req.params.id)) return res.status(400).json({ message:'Invalid invoice id' });
    const [[invoice]] = await db.query(`SELECT i.*,f.fee_name,f.is_mandatory,s.student_number,s.first_name,s.last_name,d.department_name FROM student_invoices i JOIN fee_types f ON f.fee_id=i.fee_id JOIN students s ON s.student_id=i.student_id LEFT JOIN departments d ON d.department_id=s.department_id WHERE i.invoice_id=?`, [req.params.id]);
    if (!invoice) return res.status(404).json({ message:'Invoice not found' }); const [payments] = await db.query('SELECT * FROM payments WHERE invoice_id=? ORDER BY paid_at', [req.params.id]); res.json({ ...invoice,payments });
  } catch(e) { next(e); }
};
exports.waiveInvoice = async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message:'Invalid invoice id' }); const [r] = await db.query("UPDATE student_invoices SET status='Waived',amount_paid=amount_due WHERE invoice_id=? AND status IN ('Unpaid','Partial','Overdue')", [req.params.id]); if (!r.affectedRows) return res.status(404).json({ message:'Open invoice not found' }); res.json({ message:'Invoice waived' }); } catch(e) { next(e); } };

exports.recordPayment = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { invoice_id, amount, method, reference_number } = req.body;
    if (!validId(invoice_id) || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !['Cash','Bank','Telebirr','CBE Birr','Waiver','Other'].includes(method) || (reference_number && String(reference_number).length > 100)) return res.status(400).json({ message:'Enter valid payment details' });
    await conn.beginTransaction();
    const [[invoice]] = await conn.query('SELECT * FROM student_invoices WHERE invoice_id=? FOR UPDATE', [invoice_id]);
    if (!invoice || ['Paid','Waived'].includes(invoice.status)) { await conn.rollback(); return res.status(404).json({ message:'Open invoice not found' }); }
    const remain = Number(invoice.amount_due) - Number(invoice.amount_paid);
    if (Number(amount) > remain) { await conn.rollback(); return res.status(400).json({ message:'Payment exceeds the outstanding invoice amount' }); }
    const receipt = generateReceiptNumber();
    const [p] = await conn.query('INSERT INTO payments (invoice_id,amount,method,reference_number,receipt_number,received_by) VALUES (?,?,?,?,?,?)', [invoice_id,Number(amount),method,reference_number || null,receipt,req.user.id]);
    const paid = Number(invoice.amount_paid)+Number(amount); const status = paid >= Number(invoice.amount_due) ? 'Paid' : 'Partial';
    await conn.query('UPDATE student_invoices SET amount_paid=?,status=? WHERE invoice_id=?', [paid,status,invoice_id]);
    await conn.commit(); res.status(201).json({ payment_id:p.insertId,receipt_number:receipt,status,message:'Payment recorded' });
  } catch(e) { await conn.rollback(); next(e); } finally { conn.release(); }
};
exports.payments = async (req, res, next) => { try { const [r] = await db.query(`SELECT p.*,i.invoice_number,i.student_id,s.student_number,s.first_name,s.last_name FROM payments p JOIN student_invoices i ON i.invoice_id=p.invoice_id JOIN students s ON s.student_id=i.student_id ORDER BY p.paid_at DESC`); res.json(r); } catch(e) { next(e); } };
exports.receipt = async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({message:'Invalid payment id'}); const [[r]] = await db.query(`SELECT p.*,i.invoice_number,i.amount_due,i.academic_year,i.semester,s.student_number,s.first_name,s.last_name,f.fee_name FROM payments p JOIN student_invoices i ON i.invoice_id=p.invoice_id JOIN students s ON s.student_id=i.student_id JOIN fee_types f ON f.fee_id=i.fee_id WHERE p.payment_id=?`, [req.params.id]); if(!r) return res.status(404).json({message:'Receipt not found'}); res.json(r); } catch(e) { next(e); } };

exports.summary = async (req, res, next) => { try { const [[r]] = await db.query(`SELECT COALESCE((SELECT SUM(amount) FROM payments),0) AS total_collected,COALESCE(SUM(GREATEST(amount_due-amount_paid,0)),0) AS outstanding,COALESCE(SUM(CASE WHEN due_date<CURDATE() AND status IN ('Unpaid','Partial','Overdue') THEN amount_due-amount_paid ELSE 0 END),0) AS overdue FROM student_invoices`); const [trend] = await db.query('SELECT DATE(paid_at) AS payment_date,SUM(amount) AS total FROM payments WHERE paid_at>=DATE_SUB(CURDATE(),INTERVAL 30 DAY) GROUP BY DATE(paid_at) ORDER BY payment_date'); const [recent] = await db.query(`SELECT p.payment_id,p.receipt_number,p.amount,p.method,p.paid_at,s.student_number,s.first_name,s.last_name FROM payments p JOIN student_invoices i ON i.invoice_id=p.invoice_id JOIN students s ON s.student_id=i.student_id ORDER BY paid_at DESC LIMIT 10`); res.json({ ...r,trend,recent }); } catch(e) { next(e); } };
exports.byDepartment = async (req, res, next) => { try { const [r] = await db.query(`SELECT d.department_id,d.department_name,COALESCE(SUM(GREATEST(i.amount_due-i.amount_paid,0)),0) AS outstanding FROM departments d LEFT JOIN students s ON s.department_id=d.department_id LEFT JOIN student_invoices i ON i.student_id=s.student_id AND i.status IN ('Unpaid','Partial','Overdue') GROUP BY d.department_id ORDER BY outstanding DESC`); res.json(r); } catch(e) { next(e); } };
exports.byStudents = async (req, res, next) => { try { const [r] = await db.query(`SELECT s.student_id,s.student_number,s.first_name,s.last_name,d.department_name,COALESCE(SUM(GREATEST(i.amount_due-i.amount_paid,0)),0) AS outstanding FROM students s LEFT JOIN departments d ON d.department_id=s.department_id LEFT JOIN student_invoices i ON i.student_id=s.student_id AND i.status IN ('Unpaid','Partial','Overdue') GROUP BY s.student_id ORDER BY outstanding DESC`); res.json(r); } catch(e) { next(e); } };
exports.statement = async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({message:'Invalid student id'}); const [r] = await db.query(`SELECT i.*,f.fee_name,f.fee_category,p.payment_id,p.amount AS payment_amount,p.method,p.receipt_number,p.paid_at FROM student_invoices i JOIN fee_types f ON f.fee_id=i.fee_id LEFT JOIN payments p ON p.invoice_id=i.invoice_id WHERE i.student_id=? ORDER BY i.issued_at,p.paid_at`, [req.params.id]); res.json(r); } catch(e) { next(e); } };
exports.studentFees = async (req, res, next) => { try { const [r] = await db.query(`SELECT i.*,CASE WHEN i.due_date<CURDATE() AND i.status IN ('Unpaid','Partial','Overdue') THEN 'Overdue' ELSE i.status END AS current_status,f.fee_name,f.fee_category,
  (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('payment_id',p.payment_id,'amount',p.amount,'method',p.method,'receipt_number',p.receipt_number,'paid_at',p.paid_at)),JSON_ARRAY()) FROM payments p WHERE p.invoice_id=i.invoice_id) AS payments
  FROM student_invoices i JOIN fee_types f ON f.fee_id=i.fee_id WHERE i.student_id=? ORDER BY i.issued_at DESC`, [req.user.student_id]); res.json(r); } catch(e) { next(e); } };
