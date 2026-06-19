import CrudPage from './CrudPage';

const fields = [
  { name: 'admissionNo', label: 'Admission No', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'department', label: 'Department', type: 'select', options: [
    { label: 'CSE', value: 'CSE' },
    { label: 'IT', value: 'IT' },
    { label: 'AI&DS', value: 'AI&DS' },
    { label: 'AIML', value: 'AIML' },
    { label: 'CSBS', value: 'CSBS' },
    { label: 'ECE', value: 'ECE' },
    { label: 'EEE', value: 'EEE' },
    { label: 'MECH', value: 'MECH' },
    { label: 'CIVIL', value: 'CIVIL' },
    { label: 'CHEMICAL', value: 'CHEMICAL' },
    { label: 'BIOTECH', value: 'BIOTECH' }
  ]},
  { name: 'year', label: 'Year', type: 'number' },
  { name: 'section', label: 'Section' }
];

const filters = [
  { 
    name: 'department', 
    label: 'Department', 
    options: [
      { label: 'CSE', value: 'CSE' },
      { label: 'IT', value: 'IT' },
      { label: 'AI&DS', value: 'AI&DS' },
      { label: 'AIML', value: 'AIML' },
      { label: 'CSBS', value: 'CSBS' },
      { label: 'ECE', value: 'ECE' },
      { label: 'EEE', value: 'EEE' },
      { label: 'MECH', value: 'MECH' },
      { label: 'CIVIL', value: 'CIVIL' },
      { label: 'CHEMICAL', value: 'CHEMICAL' },
      { label: 'BIOTECH', value: 'BIOTECH' }
    ]
  },
  {
    name: 'year',
    label: 'Year',
    options: [
      { label: '1st Year', value: '1' },
      { label: '2nd Year', value: '2' },
      { label: '3rd Year', value: '3' },
      { label: '4th Year', value: '4' }
    ]
  }
];

export default function StudentsPage() {
  return <CrudPage title="Students" endpoint="/students" fields={fields} customFilters={filters} />;
}