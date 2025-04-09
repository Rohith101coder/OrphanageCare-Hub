const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/orp2')
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Define the OrphanageDetails Schema
const orphanageDetailsSchema = new mongoose.Schema({
    orphanageName: { type: String, required: true },
    principalName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    numChildren: { type: Number, required: true },
    needs: { type: String, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    portNumber: { type: String, required: true, unique: true }
});

// Create a model for the OrphanageDetails
const OrphanageDetails = mongoose.model('OrphanageDetails', orphanageDetailsSchema);

// Donor Schema
const donorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Donor = mongoose.model('Donor', donorSchema);

// Orphanage Schema
const orphanageSchema = new mongoose.Schema({
    headName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: true }, // Make password unique
});

const Orphanage = mongoose.model('Orphanage', orphanageSchema);

// POST route for donor registration
app.post('/register-donor', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the donor already exists by email
        const existingDonor = await Donor.findOne({ email });

        if (existingDonor) {
            // Donor already registered, send a "Already registered" response
            return res.status(400).json({ message: 'Already registered' });
        }

        // Create new donor if not already registered
        const newDonor = new Donor({ name, email, password });
        await newDonor.save();

        // Send success response
        return res.status(201).json({ message: 'Donor registration successful!' });
    } catch (error) {
        return res.status(500).json({ message: 'Error registering donor: ' + error.message });
    }
});

// POST route for orphanage registration
app.post('/register-orphanage', async (req, res) => {
    const { headName, email, password } = req.body;

    try {
        // Check if the orphanage already exists by email
        const existingOrphanage = await Orphanage.findOne({ email });

        if (existingOrphanage) {
            // Orphanage already registered, send a "Already registered" response
            return res.status(400).json({ message: 'Already registered' });
        }

        // Create new orphanage if not already registered
        const newOrphanage = new Orphanage({ headName, email, password });
        await newOrphanage.save();

        // Send success response
        return res.status(201).json({ message: 'Orphanage registration successful!' });
    } catch (error) {
        return res.status(500).json({ message: 'Error registering orphanage: ' + error.message });
    }
});

// POST route for donor login
app.post('/login-donor', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the donor by email
        const donor = await Donor.findOne({ email });

        if (!donor) {
            // Donor not found
            return res.status(400).json({ message: 'Donor not found' });
        }

        // Check if the password matches
        if (donor.password !== password) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // If email and password match, send success response
        return res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        // Always return JSON, even on errors
        return res.status(500).json({ message: 'An error occurred: ' + error.message });
    }
});

// POST route for orphanage login
app.post('/login-orphanage', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the orphanage by email
        const orphanage = await Orphanage.findOne({ email });

        if (!orphanage) {
            // Orphanage not found
            return res.status(400).json({ message: 'Orphanage not found' });
        }

        // Check if the password matches
        if (orphanage.password !== password) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // If email and password match, send success response
        return res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        // Always return JSON, even on errors
        return res.status(500).json({ message: 'An error occurred: ' + error.message });
    }
});

// POST route for adding orphanage details
app.post('/add-orphanage', async (req, res) => {
    const { orphanageName, principalName, city, state, address, numChildren, needs, latitude, longitude, portNumber } = req.body;

    try {
        const newOrphanageDetails = new OrphanageDetails({
            orphanageName,
            principalName,
            city,
            state,
            address,
            numChildren,
            needs,
            latitude,
            longitude,
            portNumber, // Include portNumber in the details
        });

        await newOrphanageDetails.save();
        return res.status(201).json({ message: 'Orphanage details added successfully!' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ message: 'Error adding orphanage details: ' + error.message });
    }
});

// Route to check if port number is unique
app.get('/check-port-number/:portNumber', async (req, res) => {
    const portNumber = req.params.portNumber;                       //addorphanage.html

    try {
        const existingPort = await OrphanageDetails.findOne({ portNumber });

        if (existingPort) {
            return res.json({ isUnique: false }); // Port number is not unique
        }

        res.json({ isUnique: true }); // Port number is unique
    } catch (error) {
        res.status(500).json({ message: 'Error checking port number: ' + error.message });
    }
});

// Route to fetch orphanages
app.get('/get-orphanages', async (req, res) => {               //Orlist.html
    try {
        const orphanages = await OrphanageDetails.find({}, 'orphanageName principalName address numChildren needs portNumber'); // Fetch all relevant fields
        res.json(orphanages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orphanages: ' + error.message });
    }
});

// Route to get details of a specific orphanage
app.get('/orphanage-details/:id', async (req, res) => {
    try {                                                                       //totaldetails.html
        const orphanageId = req.params.id;
        const orphanage = await OrphanageDetails.findById(orphanageId);

        if (orphanage) {
            res.json(orphanage);  // Send the orphanage details as JSON
        } else {
            res.status(404).json({ message: 'Orphanage not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while fetching the orphanage details' });
    }
});

// Route to get orphanage details by port number
app.get('/get-OrphanageDetails-by-port/:portNumber', async (req, res) => {
    try {
        const portNumber = req.params.portNumber;
        const orphanage = await OrphanageDetails.findOne({ portNumber });
        
        if (orphanage) {
            return res.json(orphanage); // Send orphanage details
        } else {
            return res.status(404).send('Orphanage not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to update orphanage details by port number
app.post('/update-OrphanageDetails/:portNumber', async (req, res) => {
    const portNumber = req.params.portNumber;
    const updatedData = req.body;

    try {
        // Update orphanage details based on the port number
        const orphanage = await OrphanageDetails.findOneAndUpdate({ portNumber }, updatedData, { new: true });

        if (orphanage) {
            res.json({ message: 'Orphanage updated successfully' });
        } else {
            res.status(404).json({ message: 'Orphanage not found' });
        }
    } catch (error) {
        console.error('Error updating orphanage:', error);
        res.status(500).json({ message: 'Failed to update orphanage' });
    }
});







// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
