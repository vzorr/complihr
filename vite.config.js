import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'pages/auth/login.html'),
        dashboard: resolve(__dirname, 'pages/dashboard/dashboard.html'),
        employees: resolve(__dirname, 'pages/employees/employees.html'),
        attendance: resolve(__dirname, 'pages/attendance/attendance.html'),
        shifts: resolve(__dirname, 'pages/shifts/shifts.html'),
        leave: resolve(__dirname, 'pages/leave/leave.html'),
        tasks: resolve(__dirname, 'pages/tasks/tasks.html'),
        events: resolve(__dirname, 'pages/events/events.html'),
        incidents: resolve(__dirname, 'pages/incidents/incidents.html'),
        settings: resolve(__dirname, 'pages/settings/settings-organization.html'),
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
