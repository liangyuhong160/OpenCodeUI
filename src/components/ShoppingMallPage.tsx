import React, { useState } from 'react'

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  price: number
  memberPrice: number
  imageUrl: string
  categoryId: number
}

const ShoppingMallPage: React.FC = () => {
  // 商品分类数据
  const categories: Category[] = [
    { id: 1, name: '手机数码' },
    { id: 2, name: '家用电器' },
    { id: 3, name: '服饰鞋包' },
    { id: 4, name: '美妆护肤' },
    { id: 5, name: '食品生鲜' },
    { id: 6, name: '家居用品' },
    { id: 7, name: '运动户外' },
    { id: 8, name: '图书文具' },
  ]

  // 商品数据
  const products: Product[] = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      price: 7999,
      memberPrice: 7499,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=iPhone',
      categoryId: 1,
    },
    {
      id: 2,
      name: 'MacBook Air M2',
      price: 8999,
      memberPrice: 8499,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=MacBook',
      categoryId: 1,
    },
    {
      id: 3,
      name: '小米电视65寸',
      price: 3999,
      memberPrice: 3699,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=TV',
      categoryId: 2,
    },
    {
      id: 4,
      name: '海尔冰箱双开门',
      price: 2999,
      memberPrice: 2799,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=Fridge',
      categoryId: 2,
    },
    {
      id: 5,
      name: '耐克运动鞋',
      price: 599,
      memberPrice: 549,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=Shoes',
      categoryId: 7,
    },
    {
      id: 6,
      name: '阿迪达斯T恤',
      price: 299,
      memberPrice: 269,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=T-Shirt',
      categoryId: 3,
    },
    {
      id: 7,
      name: '兰蔻小黑瓶',
      price: 1080,
      memberPrice: 980,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=Sku',
      categoryId: 4,
    },
    {
      id: 8,
      name: '进口牛奶',
      price: 89,
      memberPrice: 79,
      imageUrl: 'https://via.placeholder.com/200x200/cccccc/969696?text=Milk',
      categoryId: 5,
    },
  ]

  const [selectedCategory, setSelectedCategory] = useState<number>(1)

  // 根据选中的分类过滤商品
  const filteredProducts = products.filter(product => product.categoryId === selectedCategory)

  // 添加商品到购物车的功能（暂时注释，可以根据需要启用）
  // const [cartItems, setCartItems] = useState<{ productId: number; quantity: number }[]>([]);
  // const addToCart = (productId: number) => {
  //   setCartItems(prev => {
  //     const existingItem = prev.find(item => item.productId === productId)
  //     if (existingItem) {
  //       return prev.map(item => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item))
  //     } else {
  //       return [...prev, { productId, quantity: 1 }]
  //     }
  //   })
  // };

  // 简化版的添加到购物车功能
  const addToCart = (productId: number) => {
    alert(`商品 ${productId} 已加入购物车`)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧分类栏 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">商品分类</h2>
        </div>
        <ul className="py-2">
          {categories.map(category => (
            <li key={category.id}>
              <button
                className={`w-full text-left px-6 py-3 hover:bg-blue-50 transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 border-l-4 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-700'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 右侧商品列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {categories.find(cat => cat.id === selectedCategory)?.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-contain rounded-md mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>

                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-red-500 font-bold">¥{product.memberPrice.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm line-through">¥{product.price.toFixed(2)}</span>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => addToCart(product.id)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      加入购物车
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && <div className="text-center py-12 text-gray-500">暂无商品</div>}
      </div>
    </div>
  )
}

export default ShoppingMallPage
