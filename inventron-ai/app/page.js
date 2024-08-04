'use client';
import React, { useState, useEffect } from "react";
import { 
  collection, 
  addDoc,
  getDoc,
  querySnapshot, 
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore"; 
import { db } from './firebase';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Paper,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  CssBaseline,
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { createTheme, ThemeProvider } from '@mui/material/styles';


// Create the theme with updated colors and font
const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif', // Set Roboto as the primary font
  },
  palette: {
    primary: {
      main: '#ffffff', // Custom primary color for buttons
    },
    secondary: {
      main: '#0c3b2e', // Custom secondary color
    },
    text: {
      primary: '#ffffff', // Set primary text color to white
      secondary: '#ffffff', // Set secondary text color to white
    },
    background: {
      default: '#e8f5e9', // Background color for the app
      paper: '#0c3b2e', // Background color for Paper component
    },
  },
});

// Define available categories
const categories = [
  "Produce",
  "Poultry and Meat",
  "Snacks",
  "Starches",
  "Nuts and Seeds",
  "Neutral"
];

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", category: "" }); // Added category state
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error'); // 'success', 'info', 'warning', 'error'
  const [recipes, setRecipes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // Add item to database
  const addItem = async (e) => {
    e.preventDefault();
  
    // Check if all required fields are filled
    if (newItem.name !== "" && newItem.quantity !== "" && newItem.category !== "") {
      const quant = parseInt(newItem.quantity);
  
      // Validate quantity
      if (quant <= 0) {
        setSnackbarMessage("Positive amount only.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
  
      const newItemName = newItem.name.trim().toLowerCase();
      const itemExist = items.find(item => item.name.toLowerCase() === newItemName);
  
      // Add or update item in Firestore
      try {
        if (itemExist) {
          // Update existing item
          await updateDoc(doc(db, "Pantry", itemExist.id), { 
            quantity: (parseInt(itemExist.quantity) + quant).toString(),
            imageDescription: newItem.imageDescription || itemExist.imageDescription
          });
        } else {
          // Add new item
          await addDoc(collection(db, "Pantry"), {
            name: newItem.name.trim(),
            quantity: newItem.quantity,
            category: newItem.category,
            imageDescription: newItem.imageDescription || ''
          });
        }
  
        // Clear form and show success message
        setNewItem({ name: "", quantity: "", category: "", imageDescription: ""});
        setSnackbarMessage("Item added successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      } catch (error) {
        console.error("Error adding or updating item:", error);
        setSnackbarMessage("Failed to add or update item.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    }
  };  
  
  // Read items from database
  useEffect(() => {
    const q = query(collection(db, "Pantry"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  // Delete item from database
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "Pantry", id));
  };

  // Filter and sort items based on search query
  const filteredItems = items
  .filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .sort((a, b) => (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ? -1 : 1));

  // IncreaseQuantity function
  const increaseQuantity = async (id, quantity) => {
    const newQuant = parseInt(quantity) + 1;
    await updateDoc(doc(db, "items", id), { quantity: newQuant.toString() });
  };

  // DecreaseQuantity function 
  const decreaseQuantity = async (id, quantity) => {
    const newQuant = Math.max(parseInt(quantity) - 1, 0);
    if (newQuant === 0) {
      await deleteItem(id);
    } else {
      await updateDoc(doc(db, "items", id), { quantity: newQuant.toString() });
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    const itemNames = items.map(item => item.name);
    
    try {
      const response = await fetch('/api/getRecipeRecommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemNames }),
      });
  
      if (response.status === 429) {
        // Handle rate limit error (e.g., wait and retry)
        setSnackbarMessage('Rate limit exceeded. Please try again later.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
  
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setSnackbarMessage('Error fetching recipes.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
    
    setLoading(false);
  };
    
  

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ backgroundColor: '#c8e6c9', minHeight: '100vh', padding: '2rem' }}>
        <Container sx={{ width: '90%', maxWidth: '600px', py: 2, backgroundColor: '#6d9773', borderRadius: '8px' }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ color: 'white' }}>
            Pantry Tracker
          </Typography>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: '#0c3b2e', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <form onSubmit={addItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Existing TextField components */}
          <TextField
            label="Enter Item"
            variant="outlined"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            fullWidth
            size={isMobile ? "small" : "medium"}
            sx={{ 
              borderRadius: '4px', // Optional: rounded corners
              mb: 1, // Optional: margin bottom for spacing between items
              backgroundColor: '#66bb6a', // Background color of the TextField
              input: { color: 'white' }, 
              label: { color: 'white' }, 
            }}
          />
          <TextField
            label="Enter Quantity"
            variant="outlined"
            type="number"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            fullWidth
            size={isMobile ? "small" : "medium"}
            sx={{
              borderRadius: '4px', // Optional: rounded corners
              mb: 1, // Optional: margin bottom for spacing between items
              backgroundColor: '#66bb6a', // Background color of the TextField
              input: { color: 'white' }, 
              label: { color: 'white' }, 
            }}
          />
          <TextField
            label="Unit of Measure"
            variant="outlined"
            value={newItem.imageDescription}
            onChange={(e) => setNewItem({ ...newItem, imageDescription: e.target.value })}
            fullWidth
            size={isMobile ? "small" : "medium"}
            sx={{
              borderRadius: '4px',
              mb: 1,
              backgroundColor: '#66bb6a',
              input: { color: 'white' },
              label: { color: 'white' },
            }}
          />
          <FormControl fullWidth>
            <InputLabel 
              id="category-label" 
              sx={{
                color: 'white',
                fontFamily: '"Roboto", "Arial", sans-serif',
                fontSize: isMobile ? '0.875rem' : '1rem', // Corrected 'rem' to '1rem'
                '&.Mui-focused': {
                  // Ensure the label styles when focused
                  color: 'white',
                },
              }}
            >
              Category
            </InputLabel>
            <Select
              labelId="category-label"
              id="category-select"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              fullWidth
              size={isMobile ? "small" : "medium"}
              sx={{
                backgroundColor: '#66bb6a', // Background color of the Select field
                color: 'white',
              }}
              label="Category" // Add label to the Select
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size={isMobile ? "small" : "medium"}
            sx={{ 
              color: 'black', 
              backgroundColor: '#ffba00', 
              padding: '.2rem .2rem', 
              maxWidth: '200px', 
              width: 'auto', 
              display: 'block', 
              margin: '0 auto', 
              '&:hover': { backgroundColor: '#e0a800' } 
            }}
          >
            Add
          </Button>
          <Button
            onClick={fetchRecipes}
            variant="contained"
            color="secondary"
            size={isMobile ? "small" : "medium"}
            sx={{
              color: 'black',
              backgroundColor: '#ffba00',
              padding: '.2rem .2rem',
              maxWidth: '200px',
              width: 'auto',
              display: 'block',
              margin: '1rem auto',
              '&:hover': { backgroundColor: '#e0a800' }
            }}
          >
            Get Recipe Recommendations
          </Button>
          <Typography variant="h6" gutterBottom align="center" sx={{ color: 'white' }}>
            Recipe Recommendations
          </Typography>
          <Paper elevation={3} sx={{ p: 2, backgroundColor: '#0c3b2e' }}>
            {loading ? (
              <Typography variant="body1" align="center" sx={{ color: 'white' }}>
                Loading...
              </Typography>
            ) : (
              <Typography variant="body1" align="center" sx={{ color: 'white' }}>
                {recipes || 'No recipes available.'}
              </Typography>
            )}
          </Paper>
        </form>
            <TextField
              label="Search Items"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              size={isMobile ? "small" : "medium"}
              sx={{
                borderRadius: '4px', // Optional: rounded corners
                backgroundColor: '#66bb6a', // Background color of the search field
                input: { color: 'white' }, 
                label: { color: 'white' }, 
              }}
            />
            <List>
              {filteredItems.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    border: '1px solid white', // White border for each item
                    borderRadius: '4px', // Optional: rounded corners
                    mb: 1, // Optional: margin bottom for spacing between items
                    backgroundColor: '#6d9773', // Highlight matching item
                    color: 'white', // Text color
                    display: 'flex',
                    alignItems: 'center', // Align items in the center
                    gap: '1rem' // Add space between image and text
                  }}
                  secondaryAction={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton edge="end" aria-label="increase" onClick={() => increaseQuantity(item.id, item.quantity)}>
                        <AddIcon sx={{ color: 'white' }} />
                      </IconButton>
                      <IconButton edge="end" aria-label="decrease" onClick={() => decreaseQuantity(item.id, item.quantity)}>
                        <RemoveIcon sx={{ color: 'white' }} />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => deleteItem(item.id)}>
                        <DeleteIcon sx={{ color: 'white' }} />
                      </IconButton>
                    </div>
                  }
                >
                  <ListItemText 
                    primary={item.name} 
                    secondary={`${item.quantity}  ${item.imageDescription}${item.imageDescription ? '' : ''} - ${item.category}`} // Display category
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Container>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}