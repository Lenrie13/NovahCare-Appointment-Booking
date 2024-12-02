document.addEventListener('DOMContentLoaded', () => {
    const branchSelect = document.getElementById('branchSelection');
    const doctorSelect = document.getElementById('doctorSelection');
    const reasonSelect = document.getElementById('reasonSelection');
    const appointmentForm = document.getElementById('appointmentBookingForm');
    const manualReasonContainer = document.getElementById('manualReasonContainer');
    const timeSelect = document.getElementById('timeSelection');
    const appointmentList = document.getElementById('appointmentList');
    const dateInput = document.getElementById('dateSelection');
    const baseURL = 'http://localhost:3000';
    let editingAppointmentId = null; // Tracking if editing an existing appointment

    let doctorsMap = {}; // To store doctor details

    // Fetching branches and populating branch selection
    const fetchBranches = async () => {
        try {
            const response = await fetch(`${baseURL}/branches`);
            const branches = await response.json();
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch.name;
                option.textContent = branch.name;
                branchSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    // Fetching reasons and populating reason selection
    const fetchReasons = async () => {
        try {
            const response = await fetch(`${baseURL}/docSpecialties`);
            const reasons = await response.json();
            reasons.forEach(reason => {
                const option = document.createElement('option');
                option.value = reason.name;
                option.textContent = reason.name;
                reasonSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    // Fetching all doctors once and populating the doctorsMap
    const fetchDoctors = async () => {
        try {
            const response = await fetch(`${baseURL}/doctors`);
            const doctors = await response.json();
            console.log('Fetched doctors:', doctors); // Logging fetched doctors
            doctors.forEach(doctor => {
                doctorsMap[doctor.id] = doctor.name;
            });
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    // Fetching doctors based on selected branch and reason
    const updateDoctorOptions = async () => {
        const branch = branchSelect.value;
        const reason = reasonSelect.value;
        doctorSelect.innerHTML = ''; // Clearing previous options

        if (branch) {
            try {
                const response = await fetch(`${baseURL}/doctors?branch=${branch}`);
                const doctors = await response.json();
                console.log('Doctors in branch:', branch, 'for reason:', reason, doctors); // Logging filtered doctors

                let filteredDoctors;
                if (reason === 'Other') {
                    filteredDoctors = doctors.filter(doctor => doctor.specialty === 'General Practitioner');
                } else {
                    filteredDoctors = doctors.filter(doctor => doctor.specialty === reason);
                }

                if (filteredDoctors.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No doctors available for this specialty';
                    doctorSelect.appendChild(option);
                } else {
                    filteredDoctors.forEach(doctor => {
                        const option = document.createElement('option');
                        option.value = doctor.id;
                        option.textContent = doctor.name;
                        doctorSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error fetching doctors:', error);
            }
        }
    };

    // Showing input field for 'Other' reasons
    reasonSelect.addEventListener('change', () => {
        manualReasonContainer.style.display = reasonSelect.value === 'Other' ? 'block' : 'none';
        updateDoctorOptions();
    });

    branchSelect.addEventListener('change', updateDoctorOptions);
    reasonSelect.addEventListener('change', updateDoctorOptions);

    // Time options excluding unwanted hours - OOF & lunch hours
    const timeRangeOptions = () => {
        timeSelect.innerHTML = ''; // Clearing previous options
        const startTime = 8;
        const endTime = 17;

        for (let hour = startTime; hour <= endTime; hour++) {
            if (hour !== 13) { // Skip 1 PM to 2 PM
                const timeString = hour.toString().padStart(2, '0') + ':00';
                const option = document.createElement('option');
                option.value = timeString;
                option.textContent = timeString;
                timeSelect.appendChild(option);
            }
        }
    };

    timeRangeOptions();

    // Handling form submission
    appointmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const selectedTime = document.getElementById('timeSelection').value;
        const selectedHour = parseInt(selectedTime.split(':')[0], 10);

        if (selectedHour < 8 || selectedHour >= 17 || selectedHour === 13) {
            alert('Please select a time between 8 AM to 5 PM, excluding 1 PM to 2 PM.');
            return;
        }

        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            age: document.getElementById('age').value,
            contact: document.getElementById('contact').value,
            email: document.getElementById('email').value,
            residence: document.getElementById('residence').value,
            reason: reasonSelect.value === 'Other' ? document.getElementById('manualReasonInput').value : reasonSelect.value,
            branch: branchSelect.value,
            doctorId: doctorSelect.value,
            date: document.getElementById('dateSelection').value,
            time: selectedTime
        };

        try {
            const response = await fetch(`${baseURL}/appointments?branch=${formData.branch}`);
            const existingAppointments = await response.json();
            console.log('Existing appointments:', existingAppointments); // Logging existing appointments

            // Checking if the time slot is already booked
            const isDoctorAlreadyBooked = (appointments, doctorId, date, time) => {
                return appointments.some(appointment => appointment.doctorId === doctorId && appointment.date === date && appointment.time === time);
            };

            if (isDoctorAlreadyBooked(existingAppointments, formData.doctorId, formData.date, formData.time) && !editingAppointmentId) {
                alert('This time slot is already booked. Please select a different time.');
            } else {
                const url = editingAppointmentId ? `${baseURL}/appointments/${editingAppointmentId}` : `${baseURL}/appointments`;
                const method = editingAppointmentId ? 'PUT' : 'POST';

                const bookingResponse = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await bookingResponse.json();
                alert(editingAppointmentId ? 'Appointment updated successfully!' : 'Appointment booked successfully!');
                appointmentForm.reset();
                editingAppointmentId = null; // Resetting editing flag
                fetchAppointments(); // Refreshing the list after booking or updating
            }
        } catch (error) {
            console.error('Error checking for double booking or submitting appointment:', error);
            alert(editingAppointmentId ? 'Failed to update appointment.' : 'Failed to book appointment.');
        }
    });

    // Fetching and displaying upcoming appointments
    const fetchAppointments = async () => {
        try {
            const response = await fetch(`${baseURL}/appointments`);
            const appointments = await response.json();
            appointmentList.innerHTML = ''; // Clearing previous list
            appointments.forEach(appointment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${appointment.date}</td>
                    <td>${appointment.time}</td>
                    <td>${doctorsMap[appointment.doctorId] || 'Unknown Doctor'}</td>
                    <td>${appointment.branch}</td>
                    <td>${appointment.reason}</td>
                    <td>
                        <button class="edit-appointment" data-id="${appointment.id}">Edit</button>
                        <button class="cancel-appointment" data-id="${appointment.id}">Cancel</button>
                    </td>
                `;
                appointmentList.appendChild(row);
            });

            // Attaching event listeners to edit and cancel buttons
            document.querySelectorAll('.edit-appointment').forEach(button => {
                button.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    editAppointment(appointmentId);
                });
            });

            document.querySelectorAll('.cancel-appointment').forEach(button => {
                button.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    cancelAppointment(appointmentId);
                });
            });
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    // Editing already existing appointments
    const editAppointment = async (appointmentId) => {
        try {
            const response = await fetch(`${baseURL}/appointments/${appointmentId}`);
            const appointment = await response.json();
            document.getElementById('firstName').value = appointment.firstName;
            document.getElementById('lastName').value = appointment.lastName;
            document.getElementById('age').value = appointment.age;
            document.getElementById('contact').value = appointment.contact;
            document.getElementById('email').value = appointment.email;
            document.getElementById('residence').value = appointment.residence;
            document.getElementById('reasonSelection').value = appointment.reason;
            document.getElementById('branchSelection').value = appointment.branch;
            document.getElementById('doctorSelection').value = appointment.doctorId;
            document.getElementById('dateSelection').value = appointment.date;
            document.getElementById('timeSelection').value = appointment.time;
            editingAppointmentId = appointmentId;
        } catch (error) {
            console.error('Error fetching appointment for editing:', error);
        }
    };

    // Canceling an appointment
    const cancelAppointment = async (appointmentId) => {
        try {
            await fetch(`${baseURL}/appointments/${appointmentId}`, {
                method: 'DELETE'
            });
            alert('Appointment canceled.');
            fetchAppointments(); // Refreshing the list after cancellation
        } catch (error) {
            console.error('Error canceling appointment:', error);
        }
    };

    // Initializing page data
    fetchBranches();
    fetchReasons();
    fetchDoctors();
    fetchAppointments();
});
