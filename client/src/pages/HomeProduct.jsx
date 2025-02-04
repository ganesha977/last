import React, { useState, useEffect } from 'react';
import { Loader, Star } from 'react-feather';
import './HomeProduct.css';
import { Link } from 'react-router-dom';
import { Drawer, Checkbox, FormControl, FormControlLabel, RadioGroup, Radio, Button, Pagination } from '@mui/material';

// ProductCard Component
const ProductCard = ({ title, originalPrice, discountedPrice, discount, rating, image, inStock }) => {
  return (
    <div className="product-card">
      <div className="image-container">
        <img src={image} alt={title} className="product-image" />
        {discount > 0 && (
          <span className="discount-badge">{discount}%</span>
        )}
      </div>
      <div className="card-content">
        <h3 className="product-title">{title}</h3>
        <div className="price-container">
          <span className="discounted-price" style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f1111' }}>
            ₹ {discountedPrice}
          </span>
          {originalPrice && (
            <span className="original-price" style={{ fontSize: '1rem', color: '#999', textDecoration: 'line-through' }}>
              ₹ {originalPrice}
            </span>
          )}
        </div>
        <p className="stock-info">{inStock ? 'In Stock' : 'Out of Stock'}</p>
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill={i < Math.floor(rating) ? "#FFA41C" : "none"} stroke="#FFA41C" />
          ))}
        </div>
      </div>
    </div>
  );
};

// HomeProduct Component
const HomeProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Fetch all categories
  const getAllCategories = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/v1/category/get-category');
      const data = await response.json();
      if (data.success) {
        setCategories(data.category);
      } else {
        setError('Failed to fetch categories.');
      }
    } catch (error) {
      setError('Failed to fetch categories.');
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch all products with pagination
  const getAllProducts = async (currentPage) => {
    try {
      const response = await fetch(`http://localhost:7000/api/v1/product/product-list/${currentPage}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch products.');
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtered products
  const filterProducts = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/v1/product/product-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checked, radio }),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to filter products.');
      console.error('Failed to filter products:', error);
    }
  };

  useEffect(() => {
    getAllCategories();
    getAllProducts(page);
  }, [page]);

  useEffect(() => {
    if (checked.length || radio.length) {
      filterProducts();
    } else {
      getAllProducts(page);
    }
  }, [checked, radio, page]);

  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
  };

  return (
    <div className="product-container">
      <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
        Filter Products
      </Button>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="filter-container">
          <h4>Filter By Category</h4>
          <div className="filter-category">
            {categories.map((c) => (
              <FormControlLabel
                key={c._id}
                control={
                  <Checkbox
                    checked={checked.includes(c._id)}
                    onChange={(e) => handleFilter(e.target.checked, c._id)}
                  />
                }
                label={c.name}
              />
            ))}
          </div>

          <h4>Filter By Price</h4>
          <div className="filter-price">
            <FormControl component="fieldset">
              <RadioGroup
                value={radio.length ? radio[0] : ''}
                onChange={(e) => setRadio([e.target.value])}
              >
                <FormControlLabel value="[0,999]" control={<Radio />} label="₹0 - 999" />
                <FormControlLabel value="[1000,1999]" control={<Radio />} label="1000 - 1999" />
                <FormControlLabel value="[2000,2999]" control={<Radio />} label="₹2000 - 2999" />
                <FormControlLabel value="[3000,30000]" control={<Radio />} label="3000 - ₹30000" />
                <FormControlLabel value="[80,99]" control={<Radio />} label="₹80 - ₹99" />
                <FormControlLabel value="[100,9999]" control={<Radio />} label="₹100 or more" />
              </RadioGroup>
            </FormControl>
          </div>
          
          <Button variant="contained" color="primary" onClick={() => {
            setDrawerOpen(false);
            if (checked.length || radio.length) {
              filterProducts();
            } else {
              getAllProducts(page);
            }
          }}>
            Apply Filters
          </Button>
          <Button variant="contained" color="secondary" onClick={() => {
            setChecked([]);
            setRadio([]);
            getAllProducts(page);
          }}>
            Reset Filters
          </Button>
        </div>
      </Drawer>

      {loading && <p className="loading-text"><Loader/></p>}
      {error && <p className="error-text">{error}</p>}
      {products.length > 0 ? (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <div key={p._id} className="product-item">
                <Link to={`/product/${p.slug}`} className="product-link">
                  <ProductCard
                    title={p.name}
                    originalPrice={p.originalPrice}
                    discountedPrice={p.discountedPrice}
                    discount={p.discount}
                    rating={p.rating}
                    image={`http://localhost:7000/api/v1/product/product-photo/${p._id}`}
                    inStock={p.inStock}
                    description={p.description}
                  />
                </Link>
              </div>
            ))}
          </div>
          <Pagination
            count={10} // This should be dynamic based on the total count of products
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </>
      ) : (
        <p>No products found.</p>
      )}
    </div>
  );
};

export default HomeProduct;
