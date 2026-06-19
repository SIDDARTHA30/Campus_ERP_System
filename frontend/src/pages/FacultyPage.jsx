import CrudPage from './CrudPage';

const fields = [
  { name: 'employeeCode', label: 'Employee ID', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
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
  { name: 'designation', label: 'Designation' }
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
  }
];

export default function FacultyPage() {
  return <CrudPage title="Faculty" endpoint="/faculty" fields={fields} customFilters={filters} />;
}
