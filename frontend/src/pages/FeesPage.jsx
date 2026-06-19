import CrudPage from './CrudPage';

const fields = [
  { name: 'student', label: 'Student ID' },
  { name: 'term', label: 'Term' },
  { name: 'feeType', label: 'Fee Type' },
  { name: 'amount', label: 'Amount', type: 'number' },
  { name: 'paidAmount', label: 'Paid Amount', type: 'number' },
  { name: 'dueDate', label: 'Due Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['pending', 'partial', 'paid'] },
  { name: 'paidDate', label: 'Paid Date', type: 'date' },
  { name: 'remarks', label: 'Remarks' }
];

export default function FeesPage() {
  return <CrudPage title="Fees" endpoint="/fees" fields={fields} />;
}
