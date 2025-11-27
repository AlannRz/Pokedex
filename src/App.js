import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    imagen: null,
    tipo: '',
    localizacion: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [theme, setTheme] = useState('light');
  const [consoleColor, setConsoleColor] = useState('#ff0000');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const tipos = [
    'Fuego','Agua','Planta','Eléctrico','Tierra','Roca','Hielo',
    'Volador','Psíquico','Fantasma','Dragón','Siniestro','Acero','Hada'
  ];

  // Verificar conexión
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/health');
      const data = await response.json();
      setIsConnected(data.status === 'success');
    } catch (error) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchPokemons();
    fetchCart();
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Obtener Pokémon
  const fetchPokemons = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/pokemons');
      const data = await response.json();
      setPokemons(data);
    } catch (error) {
      console.error('Error al cargar Pokémon:', error);
    }
  };

  // Obtener carrito
  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/cart');
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    }
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData({ ...formData, imagen: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.imagen || !formData.tipo || !formData.localizacion) {
      return alert('Por favor, completa todos los campos.');
    }

    try {
      if (editingId) {
        await fetch(`http://localhost:3002/api/pokemons/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        setEditingId(null);
      } else {
        await fetch('http://localhost:3002/api/pokemons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setFormData({ nombre: '', imagen: null, tipo: '', localizacion: '' });
      fetchPokemons();
    } catch (error) {
      console.error('Error guardando Pokémon:', error);
    }
  };

  const handleEdit = (pokemon) => {
    setEditingId(pokemon.id);
    setFormData({
      nombre: pokemon.nombre,
      imagen: pokemon.imagen,
      tipo: pokemon.tipo,
      localizacion: pokemon.localizacion
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este Pokémon?')) return;
    try {
      await fetch(`http://localhost:3002/api/pokemons/${id}`, { method: 'DELETE' });
      fetchPokemons();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const addToCart = async (pokemonId) => {
    try {
      await fetch('http://localhost:3002/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemon_id: pokemonId })
      });
      fetchCart();
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
    }
  };

  const removeFromCart = async (id) => {
    try {
      await fetch(`http://localhost:3002/api/cart/${id}`, { method: 'DELETE' });
      fetchCart();
    } catch (error) {
      console.error('Error quitando del carrito:', error);
    }
  };

  return (
    <div className="App">
      <h1>Pokedex App</h1>

      {/* Indicador de conexión */}
      <p style={{ color: isConnected ? 'green' : 'red' }}>
        {isConnected ? 'Conectado al backend' : 'Sin conexión'}
      </p>

      {/* Tema */}
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Cambiar a {theme === 'light' ? 'Oscuro' : 'Claro'}
      </button>

      {/* Cambiar color consola */}
      <input
        type="color"
        value={consoleColor}
        onChange={(e) => setConsoleColor(e.target.value)}
      />

      {/* Botón carrito */}
      <button onClick={() => setShowCart(!showCart)}>
        {showCart ? 'Volver' : `Carrito (${cart.length})`}
      </button>

      {/* Vista carrito */}
      {showCart ? (
        <div className="cart">
          <h2>Carrito</h2>
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <img src={item.imagen} alt="" />
              <p>{item.nombre}</p>
              <button onClick={() => removeFromCart(item.id)}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              placeholder="Nombre"
              onChange={handleInputChange}
            />
            <input type="file" accept="image/*" onChange={handleFileChange} />

            <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
              <option value="">Tipo</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <input
              type="text"
              name="localizacion"
              value={formData.localizacion}
              placeholder="Localización"
              onChange={handleInputChange}
            />

            <button type="submit">{editingId ? 'Actualizar' : 'Agregar'}</button>
          </form>

          {/* Lista Pokémon */}
          <div className="grid">
            {pokemons.map(p => (
              <div key={p.id} className="card">
                <img src={p.imagen} alt="" onClick={() => setSelectedPokemon(p)} />
                <h3>{p.nombre}</h3>
                <p>{p.tipo}</p>
                <button onClick={() => handleEdit(p)}>Editar</button>
                <button onClick={() => handleDelete(p.id)}>Eliminar</button>
                <button onClick={() => addToCart(p.id)}>Añadir al carrito</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vista detallada */}
      {selectedPokemon && (
        <div className="modal">
          <div className="modal-content" style={{ borderColor: consoleColor }}>
            <button onClick={() => setSelectedPokemon(null)}>Cerrar</button>
            <img src={selectedPokemon.imagen} alt="" />
            <h2>{selectedPokemon.nombre}</h2>
            <p>Tipo: {selectedPokemon.tipo}</p>
            <p>Localización: {selectedPokemon.localizacion}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
