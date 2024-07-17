document.addEventListener('DOMContentLoaded', function() {
    const branchSelect = document.getElementById('branchSelection');
    const doctorSelect = document.getElementById('doctorSelection');
    const reasonSelect = document.getElementById('reasonSelection');
    const appointmentForm = document.getElementById('appointmentBookingForm');
    const manualReasonContainer = document.getElementById('manualReasonContainer');
    const timeSelect = document.getElementById('timeSelection');
    const appointmentList = document.getElementById('appointmentList');
    const baseURL = 'http://localhost:3000';
    let editingAppointmentId = null; // Tracking if editing an existing appointment

    let doctorsMap = {}; // To store doctor details

    // Fetching branches and populate branch select
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

    //Fetching reasons and populate reason select
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

    // Showing input field for 'Other' reason
    reasonSelect.addEventListener('change', () => {
        if (reasonSelect.value === 'Other') {
            manualReasonContainer.style.display = 'block';
        } else {
            manualReasonContainer.style.display = 'none';
        }
        updateDoctorOptions(); // Updating doctor options when reason changes
    });

    // Fetching all doctors once and populate the doctorsMap
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

                // Cheking if the time slot is already booked
                // Patients cannot book the same doctor, same branch, same day and time as an already existing booking
                const isDoctorAlreadyBooked = (appointments, doctorId, date, time) => {
                    const existingAppointment = appointments.find((appointment) => appointment.doctorId === doctorId && appointment.date === date && appointment.time === time);
                
                    if (existingAppointment) {
                        return true;
                    }
                
                    return false;
                }
                
                if (isDoctorAlreadyBooked(existingAppointments, formData.doctorId, formData.date, formData.time) > 0 && !editingAppointmentId) {
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
                reasonSelect.value = appointment.reason;
                branchSelect.value = appointment.branch;
                updateDoctorOptions(); // Updating doctor options based on the selected branch and reason
                doctorSelect.value = appointment.doctorId;
                document.getElementById('dateSelection').value = appointment.date;
                document.getElementById('timeSelection').value = appointment.time;

                editingAppointmentId = appointmentId; // Setting the editing flag
            })
            .catch(error => console.error('Error fetching appointment details:', error));
    }

    // Cancelling appointment prompt
    // Confirms if patient intends to cancel an upcoming appointment
    const cancelAppointment = (appointmentId) => {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            fetch(`${baseURL}/appointments/${appointmentId}`, {
                method: 'DELETE'
            })
            .then(() => {
                alert('Appointment cancelled successfully.');
                fetchAppointments(); // Refreshing the list after successful cancellation
            })
            .catch(error => {
                console.error('Error cancelling appointment:', error);
                alert('Failed to cancel appointment.');
            });
        }
    }

    // Initial fetching of doctors and corresponding appointments
    fetchDoctors()
    .then(fetchAppointments);
});