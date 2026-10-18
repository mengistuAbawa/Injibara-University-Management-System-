/** Finance officer and administrator API routes. */
const router = require('express').Router();
const c = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('finance', 'admin'));
router.get('/fees', c.listFees); router.post('/fees', c.createFee); router.put('/fees/:id', c.updateFee); router.delete('/fees/:id', c.deleteFee);
router.get('/invoices', c.listInvoices); router.post('/invoices', c.createInvoice); router.post('/invoices/bulk', c.bulkInvoices);
router.get('/invoices/:id', c.invoiceDetail); router.patch('/invoices/:id/waive', c.waiveInvoice);
router.post('/payments', c.recordPayment); router.get('/payments', c.payments); router.get('/payments/:id/receipt', c.receipt);
router.get('/reports/summary', c.summary); router.get('/reports/by-dept', c.byDepartment); router.get('/reports/students', c.byStudents);
router.get('/students/:id/statement', c.statement);

module.exports = router;
