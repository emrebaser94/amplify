import "./amplify-init";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import { Authenticator } from "@aws-amplify/ui-react";
import type { Schema } from "../../amplify/data/resource";

function App({ signOut, user }: any) {
  const client = generateClient<Schema>();
  const [activeTab, setActiveTab] = useState<'groups' | 'employees' | 'templates' | 'schedule'>('groups');

  // State für Wohngruppen
  const [residentialGroups, setResidentialGroups] = useState<any[]>([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  // State für Mitarbeiter
  const [employees, setEmployees] = useState<any[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    maxWeeklyHours: 40
  });

  // State für Schichtvorlagen
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    startTime: '',
    endTime: '',
    color: '#3B82F6',
    sortOrder: 1
  });

  // State für Schichten
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    await Promise.all([
      fetchResidentialGroups(),
      fetchEmployees(),
      fetchShiftTemplates(),
      fetchShifts()
    ]);
  }

  async function fetchResidentialGroups() {
    const res = await client.models.ResidentialGroup.list();
    setResidentialGroups(res.data);
    if (res.data.length > 0 && !selectedGroup) {
      setSelectedGroup(res.data[0].id);
    }
  }

  async function fetchEmployees() {
    const res = await client.models.Employee.list();
    setEmployees(res.data);
  }

  async function fetchShiftTemplates() {
    const res = await client.models.ShiftTemplate.list();
    setShiftTemplates(res.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
  }

  async function fetchShifts() {
    const res = await client.models.Shift.list();
    setShifts(res.data);
  }

  async function createResidentialGroup() {
    if (!newGroup.name) return;
    await client.models.ResidentialGroup.create(newGroup);
    setNewGroup({ name: '', description: '' });
    fetchResidentialGroups();
  }

  async function createEmployee() {
    if (!newEmployee.firstName || !newEmployee.lastName) return;
    await client.models.Employee.create(newEmployee);
    setNewEmployee({ firstName: '', lastName: '', email: '', position: '', maxWeeklyHours: 40 });
    fetchEmployees();
  }

  async function createShiftTemplate() {
    if (!newTemplate.name || !newTemplate.startTime || !newTemplate.endTime) return;
    await client.models.ShiftTemplate.create(newTemplate);
    setNewTemplate({ name: '', startTime: '', endTime: '', color: '#3B82F6', sortOrder: 1 });
    fetchShiftTemplates();
  }

  async function createShift(employeeId: string, templateId: string) {
    if (!selectedGroup || !selectedDate) return;

    await client.models.Shift.create({
      date: selectedDate,
      employeeId,
      residentialGroupId: selectedGroup,
      shiftTemplateId: templateId,
      isConfirmed: false
    });

    fetchShifts();
  }

  async function deleteShift(shiftId: string) {
    await client.models.Shift.delete({ id: shiftId });
    fetchShifts();
  }

  const filteredShifts = shifts.filter(
    s => s.date === selectedDate && s.residentialGroupId === selectedGroup
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f3f4f6, #e5e7eb)' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          📋 Dienstplan Manager
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#6b7280' }}>👤 {user?.signInDetails?.loginId}</span>
          <button onClick={signOut} style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}>
            Abmelden
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { key: 'groups', label: '🏠 Wohngruppen' },
            { key: 'employees', label: '👥 Mitarbeiter' },
            { key: 'templates', label: '⏰ Schichtvorlagen' },
            { key: 'schedule', label: '📅 Dienstplan' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.key ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>

        {/* Wohngruppen Tab */}
        {activeTab === 'groups' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Wohngruppen verwalten</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <input
                placeholder="Name der Wohngruppe"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Beschreibung"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <button onClick={createResidentialGroup} style={{
                padding: '0.5rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}>
                Hinzufügen
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {residentialGroups.map(group => (
                <div key={group.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  background: '#f9fafb'
                }}>
                  <h3 style={{ fontWeight: '600' }}>{group.name}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{group.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mitarbeiter Tab */}
        {activeTab === 'employees' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Mitarbeiter verwalten</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <input
                placeholder="Vorname"
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Nachname"
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="E-Mail"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Position"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Max. Wochenstunden"
                type="number"
                value={newEmployee.maxWeeklyHours}
                onChange={(e) => setNewEmployee({ ...newEmployee, maxWeeklyHours: Number(e.target.value) })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <button onClick={createEmployee} style={{
                padding: '0.5rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}>
                Hinzufügen
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
              {employees.map(emp => (
                <div key={emp.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ fontWeight: '600' }}>{emp.firstName} {emp.lastName}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {emp.position} • {emp.maxWeeklyHours}h/Woche
                    </p>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{emp.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schichtvorlagen Tab */}
        {activeTab === 'templates' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Schichtvorlagen verwalten</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '1rem', marginBottom: '2rem' }}>
              <input
                placeholder="Schichtname"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Start"
                type="time"
                value={newTemplate.startTime}
                onChange={(e) => setNewTemplate({ ...newTemplate, startTime: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Ende"
                type="time"
                value={newTemplate.endTime}
                onChange={(e) => setNewTemplate({ ...newTemplate, endTime: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                type="color"
                value={newTemplate.color}
                onChange={(e) => setNewTemplate({ ...newTemplate, color: e.target.value })}
                style={{ padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <input
                placeholder="Sortierung"
                type="number"
                value={newTemplate.sortOrder}
                onChange={(e) => setNewTemplate({ ...newTemplate, sortOrder: Number(e.target.value) })}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
              <button onClick={createShiftTemplate} style={{
                padding: '0.5rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}>
                +
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {shiftTemplates.map(template => (
                <div key={template.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.375rem',
                    background: template.color
                  }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '600' }}>{template.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {template.startTime} - {template.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dienstplan Tab */}
        {activeTab === 'schedule' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Dienstplan erstellen</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              >
                <option value="">Wohngruppe wählen</option>
                {residentialGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            {selectedGroup && (
              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Schichten für {selectedDate}</h3>

                {shiftTemplates.map(template => {
                  const assignedShift = filteredShifts.find(s => s.shiftTemplateId === template.id);
                  const assignedEmployee = assignedShift ? employees.find(e => e.id === assignedShift.employeeId) : null;

                  return (
                    <div key={template.id} style={{
                      padding: '1rem',
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '0.5rem',
                        height: '3rem',
                        borderRadius: '0.25rem',
                        background: template.color
                      }} />

                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: '600' }}>{template.name}</h4>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {template.startTime} - {template.endTime}
                        </p>
                      </div>

                      {assignedEmployee ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.5rem 1rem',
                          background: '#f3f4f6',
                          borderRadius: '0.375rem'
                        }}>
                          <span>{assignedEmployee.firstName} {assignedEmployee.lastName}</span>
                          <button onClick={() => deleteShift(assignedShift.id)} style={{
                            padding: '0.25rem 0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              createShift(e.target.value, template.id);
                              e.target.value = '';
                            }
                          }}
                          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                        >
                          <option value="">Mitarbeiter zuweisen</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Authenticator>
      {({ signOut, user }) => <App signOut={signOut} user={user} />}
    </Authenticator>
  );
}