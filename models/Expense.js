const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['FUEL', 'PACKAGING', 'PREPARATION', 'MARKETING', 'SALARY', 'OTHERS'], default: 'OTHERS' },
    date: { type: Date, default: Date.now },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
