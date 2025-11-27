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
  // Estado para el tema (solo light/dark, sin cardColor)
  const [theme, setTheme] = useState('light'); // 'light' o 'dark'
  // Nuevo estado para el color de la consola (solo afecta a la vista detallada)
  const [consoleColor, setConsoleColor] = useState('#ff0000');
  // Nuevo estado para el carrito de compras (ahora se carga desde DB)
  const [cart, setCart] = useState([]);
  // Nuevo estado para mostrar la vista de carrito
  const [showCart, setShowCart] = useState(false);

  const tipos = ['Fuego', 'Agua', 'Planta', 'Eléctrico', 'Tierra', 'Roca', 'Hielo', 'Volador', 'Psíquico', 'Fantasma', 'Dragón', 'Siniestro', 'Acero', 'Hada'];

  // Función para verificar conexión
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/health');
      const data = await response.json();
      setIsConnected(data.status === 'success');
    } catch (error) {
      setIsConnected(false);
    }
  };

  // Cargar Pokémon, carrito y verificar conexión al montar
  useEffect(() => {
    fetchPokemons();
    fetchCart();  // Nueva función para cargar el carrito desde DB
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Aplicar el tema al body cuando cambie
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const fetchPokemons = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/pokemons');
      const data = await response.json();
      console.log('Pokémon cargados:', data);  // Verifica los datos en consola
      data.forEach(pokemon => {
        console.log(`Imagen de ${pokemon.nombre}:`, pokemon.imagen ? pokemon.imagen.substring(0, 50) + '...' : 'No hay imagen');  // Muestra el inicio del base64
      });
      setPokemons(data);
    } catch (error) {
      console.error('Error al cargar Pokémon:', error);
    }
  };

  // Nueva función para cargar el carrito desde DB (con JOIN para datos completos)
  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/cart');
      const data = await response.json();
      setCart(data);  // data incluye los datos del Pokémon gracias al JOIN
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, imagen: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.imagen || !formData.tipo || !formData.localizacion) {
      alert('Por favor, completa todos los campos.');
      return;
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
      console.error('Error al guardar Pokémon:', error);
    }
  };

  const handleEdit = (pokemon) => {
    setFormData(pokemon);
    setEditingId(pokemon.id);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3002/api/pokemons/${id}`, {
        method: 'DELETE'
      });
      fetchPokemons();
    } catch (error) {
      console.error('Error al eliminar Pokémon:', error);
    }
  };

  const handleCardClick = (pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const closeDetailView = () => {
    setSelectedPokemon(null);
  };

  // Función para cambiar el color de la consola a uno aleatorio
  const changeConsoleColor = () => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    setConsoleColor(randomColor);
  };

  // Nueva función para agregar al carrito (envía solo pokemon_id y color a DB)
  const addToCart = async () => {
    if (selectedPokemon) {
      const cartData = {
        pokemon_id: selectedPokemon.id,
        color: consoleColor
      };
      try {
        await fetch('http://localhost:3002/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cartData)
        });
        alert(`${selectedPokemon.nombre} agregado al carrito con color ${consoleColor}!`);
        fetchCart();  // Recargar el carrito desde DB para reflejar cambios
      } catch (error) {
        console.error('Error al agregar al carrito:', error);
      }
    }
  };

  // Nueva función para eliminar un item del carrito
  const removeFromCart = async (cartId) => {
    try {
      await fetch(`http://localhost:3002/api/cart/${cartId}`, {
        method: 'DELETE'
      });
      fetchCart();  // Recargar el carrito desde DB
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
    }
  };

  return (
    <div className="pokedex">
      <header className="pokedex-header">
        <h1>Pokédex</h1>
        {/* Panel de personalización: solo el botón de tema */}
        <div className="customization">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '☀️ Modo Oscuro' : '🌙 Modo Claro'}
          </button>
        </div>
        {/* Botón del icono de agenda para ver el carrito */}
        <button className="agenda-button" onClick={() => setShowCart(true)} title="Ver Lista de Compra">
          📓
        </button>
      </header>
      <div className="pokedex-body">
        {showCart ? (
          <div className="cart-view">
            <h2>Lista de Compra</h2>
            {cart.length === 0 ? (
              <p className="cart-empty">El carrito está vacío.</p>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div
                    key={item.id}  // Usar item.id (de cart_items)
                    className="cart-card"
                    style={{ backgroundColor: item.color }}
                  >
                    <img src={item.imagen} alt={item.nombre} />
                    <h3>{item.nombre}</h3>
                    <p>Tipo: {item.tipo}</p>
                    <p>Localización: {item.localizacion}</p>
                    <p>Color: {item.color}</p>
                    <button className="ds-button" onClick={() => removeFromCart(item.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
            <button className="ds-button" onClick={() => setShowCart(false)}>Cerrar</button>
          </div>
        ) : (
          <>
            {!selectedPokemon && (
              <form className="pokemon-form" onSubmit={handleSubmit}>
                <h2>{editingId ? 'Editar Pokémon' : 'Agregar Pokémon'}</h2>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!editingId}
                />
                <select name="tipo" value={formData.tipo} onChange={handleInputChange} required>
                  <option value="">Selecciona Tipo</option>
                  {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="text"
                  name="localizacion"
                  placeholder="Localización en la región"
                  value={formData.localizacion}
                  onChange={handleInputChange}
                  required
                />
                <button type="submit">{editingId ? 'Actualizar' : 'Agregar'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ nombre: '', imagen: null, tipo: '', localizacion: '' }); }}>Cancelar</button>}
              </form>
            )}

            {selectedPokemon ? (
              <div className="ds-view" style={{ backgroundColor: consoleColor }}>
                {/* Botón del carrito de compras */}
                <button className="cart-button" onClick={addToCart} title="Agregar al carrito">
                  🛒
                </button>
                <div className="ds-screen-top">
                  <img src={selectedPokemon.imagen} alt={selectedPokemon.nombre} className="ds-image" />
                </div>
                <div className="ds-screen-bottom">
                  <h2>{selectedPokemon.nombre}</h2>
                  <p><strong>Tipo:</strong> {selectedPokemon.tipo}</p>
                  <p><strong>Localización:</strong> {selectedPokemon.localizacion}</p>
                  <button className="ds-button" onClick={closeDetailView}>Cerrar</button>
                  {/* Nuevo botón para cambiar el color de la consola, solo visible aquí */}
                  <button className="ds-button" onClick={changeConsoleColor}>Cambiar Color Consola</button>
                </div>
              </div>
            ) : (
              <div className="pokemon-list">
                {/* Duplicar la lista para scroll infinito seamless */}
                {pokemons.concat(pokemons).map((pokemon, index) => (
                  <div
                    key={`${pokemon.id}-${index}`}
                    className="pokemon-card"
                    onClick={() => handleCardClick(pokemon)}
                  >
                    {/* Agrega un console.log temporal para cada imagen */}
                    {console.log(`Renderizando imagen para ${pokemon.nombre}:`, pokemon.imagen)}
                    {/* Prueba con una imagen hardcodeada para confirmar que <img> funciona */}
                    {/* <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Test" /> */}
                    <img src={pokemon.imagen} alt={pokemon.nombre} />
                    <h3>{pokemon.nombre}</h3>
                    <p>Tipo: {pokemon.tipo}</p>
                    <p>Localización: {pokemon.localizacion}</p>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(pokemon); }}>Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(pokemon.id); }}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'Conectado' : 'Sin conexión'}
      </div>
    </div>
  );
}

export default App;
