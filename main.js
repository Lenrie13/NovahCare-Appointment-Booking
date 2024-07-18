document.addEventListener('DOMContentLoaded', function() {
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
    fetch(`${baseURL}/branches`)
        .then(response => response.json())
        .then(branches => {
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch.name;
                option.textContent = branch.name;
                branchSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching branches:', error));

    // Fetching reasons and populating reason selection
    fetch(`${baseURL}/docSpecialties`)
        .then(response => response.json())
        .then(reasons => {
            reasons.forEach(reason => {
                const option = document.createElement('option');
                option.value = reason.name;
                option.textContent = reason.name;
                reasonSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching specialties:', error));

    // Showing input field for 'Other' reasons
    reasonSelect.addEventListener('change', () => {
        if (reasonSelect.value === 'Other') {
            manualReasonContainer.style.display = 'block';
        } else {
            manualReasonContainer.style.display = 'none';
        }
        updateDoctorOptions(); // Updating doctor options when reason changes
    });

    // Fetching all doctors once and populating the doctorsMap
    const fetchDoctors = () => {
        return fetch(`${baseURL}/doctors`)
            .then(response => response.json())
            .then(doctors => {
                console.log('Fetched doctors:', doctors); // Logging fetched doctors
                doctors.forEach(doctor => {
                    doctorsMap[doctor.id] = doctor.name;
                });
            })
            .catch(error => console.error('Error fetching doctors:', error));
    };

    // Fetching doctors based on selected branch and reason
    const updateDoctorOptions = () => {
        const branch = branchSelect.value;
        const reason = reasonSelect.value;
        doctorSelect.innerHTML = ''; // Clearing previous options

        if (branch) {
            fetch(`${baseURL}/doctors?branch=${branch}`)
                .then(response => response.json())
                .then(doctors => {
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
                })
                .catch(error => console.error('Error fetching doctors:', error));
        }
    };

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
    appointmentForm.addEventListener('submit', function(event) {
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

        fetch(`${baseURL}/appointments?branch=${formData.branch}`)
            .then(response => response.json())
            .then(existingAppointments => {
                console.log('Existing appointments:', existingAppointments); // Logging existing appointments

                // Checking if the time slot is already booked
                const isDoctorAlreadyBooked = (appointments, doctorId, date, time) => {
                    const existingAppointment = appointments.find(appointment => appointment.doctorId === doctorId && appointment.date === date && appointment.time === time);
                    return !!existingAppointment;
                };

                if (isDoctorAlreadyBooked(existingAppointments, formData.doctorId, formData.date, formData.time) && !editingAppointmentId) {
                    alert('This time slot is already booked. Please select a different time.');
                } else {
                    const url = editingAppointmentId ? `${baseURL}/appointments/${editingAppointmentId}` : `${baseURL}/appointments`;
                    const method = editingAppointmentId ? 'PUT' : 'POST';

                    fetch(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert(editingAppointmentId ? 'Appointment updated successfully!' : 'Appointment booked successfully!');
                        appointmentForm.reset();
                        editingAppointmentId = null; // Resetting editing flag
                        fetchAppointments(); // Refreshing the list after booking or updating
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert(editingAppointmentId ? 'Failed to update appointment.' : 'Failed to book appointment.');
                    });
                }
            })
            .catch(error => console.error('Error checking for double booking:', error));
    });

    // Fetching and displaying upcoming appointments
    const fetchAppointments = () => {
        fetch(`${baseURL}/appointments`)
            .then(response => response.json())
            .then(appointments => {
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

                // Attaching event listeners to edit buttons
                document.querySelectorAll('.edit-appointment').forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        editAppointment(appointmentId);
                    });
                });

                // Attaching event listeners to cancel buttons
                document.querySelectorAll('.cancel-appointment').forEach(button => {
                    button.addEventListener('click', function() {
                        const appointmentId = this.getAttribute('data-id');
                        cancelAppointment(appointmentId);
                    });
                });
            })
            .catch(error => console.error('Error fetching appointments:', error));
    }

    // Editing already existing appointments
    const editAppointment = (appointmentId) => {
        fetch(`${baseURL}/appointments/${appointmentId}`)
            .then(response => response.json())
            .then(appointment => {
                document.getElementById('firstName').value = appointment.firstName;
                document.getElementById('lastName').value = appointment.lastName;
                document.getElementById('age').value = appointment.age;
                document.getElementById('contact').value = appointment.contact;
                document.getElementById('email').value = appointment.email;
                document.getElementById('residence').value = appointment.residence;
                branchSelect.value = appointment.branch;
                reasonSelect.value = appointment.reason;
                updateDoctorOptions().then(() => {
                    doctorSelect.value = appointment.doctorId;
                });
                document.getElementById('dateSelection').value = appointment.date;
                document.getElementById('timeSelection').value = appointment.time;
                editingAppointmentId = appointmentId; // Setting the editing flag
            })
            .catch(error => console.error('Error fetching appointment:', error));
    }

    // Canceling already existing appointments
    const cancelAppointment = (appointmentId) => {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            fetch(`${baseURL}/appointments/${appointmentId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    alert('Appointment canceled successfully!');
                    fetchAppointments(); // Refreshing the list after cancelation
                } else {
                    alert('Failed to cancel appointment.');
                }
            })
            .catch(error => console.error('Error canceling appointment:', error));
        }
    }

    // Setting min date to today with the correct format for the min attribute
    const setMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based (January would be 0, Feb 1 etc so we add 1 to get the correct one for Dec)
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`; // Format for the min attribute- my dates show as dd/mm/yyyy
        dateInput.setAttribute('min', formattedDate);
    }

    // Initial fetching of doctors and corresponding appointments
    fetchDoctors().then(fetchAppointments);

    // Setting the minimum date on page load
    setMinDate();
});