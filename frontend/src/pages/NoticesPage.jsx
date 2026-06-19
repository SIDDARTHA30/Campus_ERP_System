import CrudPage from './CrudPage';

const fields = [
  { name: 'title', label: 'Title' },
  { name: 'content', label: 'Content' },
  { name: 'audience', label: 'Audience', type: 'select', options: ['all', 'students', 'faculty', 'admins', 'department'] },
  { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high'] },
  { name: 'expiresAt', label: 'Expires At', type: 'date' }
];

export default function NoticesPage() {
  return <CrudPage title="Notices" endpoint="/notices" fields={fields} />;
}
