const router = require('express').Router();
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

router.get('/:orderId', auth(['user', 'admin', 'vendor']), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('items.product user');
        if (!order) return res.status(404).send("Order not found");

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);

        doc.pipe(res);

        doc.fontSize(25).text('Daru Hunting Invoice', 100, 50);
        doc.fontSize(12).moveDown();
        doc.text(`Invoice #${order.id}`);
        doc.text(`Date: ${order.createdAt.toDateString()}`);
        doc.text(`Customer: ${order.user.name}`);
        doc.moveDown();
        doc.text(`Total: Rs ${order.total}`);
        doc.moveDown();
        doc.text('Items:');
        doc.moveDown();

        order.items.forEach(i => {
            const productName = i.product ? i.product.name : 'Unknown Product';
            doc.text(`${productName} x ${i.quantity} = Rs ${i.price * i.quantity}`);
        });

        doc.end();
    } catch (e) {
        if (!res.headersSent) res.status(500).send("Error generating invoice");
    }
});

module.exports = router;
