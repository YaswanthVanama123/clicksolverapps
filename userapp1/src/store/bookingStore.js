import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import axios from 'axios';

const useBookingStore = create(
  devtools(
    (set, get) => ({
      // State
      cart: [],
      selectedServices: [],
      selectedAddress: null,
      bookingInProgress: false,
      currentBookingId: null,
      tipAmount: 0,
      appliedOffer: null,
      discount: 0,

      // Actions
      addToCart: service => {
        const {cart} = get();
        const existingItem = cart.find(item => item.id === service.id);

        if (existingItem) {
          // Update quantity if already in cart
          set(
            {
              cart: cart.map(item =>
                item.id === service.id
                  ? {...item, quantity: item.quantity + 1}
                  : item,
              ),
            },
            false,
            'addToCart_increment',
          );
        } else {
          // Add new item to cart
          set(
            {
              cart: [...cart, {...service, quantity: 1}],
            },
            false,
            'addToCart_new',
          );
        }
      },

      removeFromCart: serviceId => {
        const {cart} = get();
        set(
          {
            cart: cart.filter(item => item.id !== serviceId),
          },
          false,
          'removeFromCart',
        );
      },

      updateQuantity: (serviceId, quantity) => {
        const {cart} = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set(
            {
              cart: cart.filter(item => item.id !== serviceId),
            },
            false,
            'updateQuantity_remove',
          );
        } else {
          set(
            {
              cart: cart.map(item =>
                item.id === serviceId ? {...item, quantity} : item,
              ),
            },
            false,
            'updateQuantity',
          );
        }
      },

      setAddress: address => {
        set({selectedAddress: address}, false, 'setAddress');
      },

      setTip: amount => {
        set({tipAmount: amount}, false, 'setTip');
      },

      applyOffer: offer => {
        const {cart} = get();

        // Calculate discount based on offer
        let discount = 0;
        const subtotal = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        if (offer.type === 'percentage') {
          discount = (subtotal * offer.value) / 100;
        } else if (offer.type === 'fixed') {
          discount = offer.value;
        }

        // Apply max discount limit if exists
        if (offer.maxDiscount && discount > offer.maxDiscount) {
          discount = offer.maxDiscount;
        }

        set(
          {
            appliedOffer: offer,
            discount,
          },
          false,
          'applyOffer',
        );
      },

      clearCart: () => {
        set(
          {
            cart: [],
            selectedServices: [],
            selectedAddress: null,
            tipAmount: 0,
            appliedOffer: null,
            discount: 0,
          },
          false,
          'clearCart',
        );
      },

      startBooking: async data => {
        set({bookingInProgress: true}, false, 'startBooking_start');

        try {
          const {cart, selectedAddress, tipAmount, appliedOffer, discount} =
            get();

          const bookingData = {
            services: cart,
            address: selectedAddress,
            tip: tipAmount,
            offer: appliedOffer,
            discount,
            ...data,
          };

          // Replace with your actual API endpoint
          const response = await axios.post('/api/bookings', bookingData);

          set(
            {
              currentBookingId: response.data.bookingId,
              bookingInProgress: false,
            },
            false,
            'startBooking_success',
          );

          return {success: true, bookingId: response.data.bookingId};
        } catch (error) {
          set({bookingInProgress: false}, false, 'startBooking_error');
          return {
            success: false,
            error: error.response?.data?.message || 'Booking failed',
          };
        }
      },

      completeBooking: () => {
        set(
          {
            cart: [],
            selectedServices: [],
            selectedAddress: null,
            bookingInProgress: false,
            currentBookingId: null,
            tipAmount: 0,
            appliedOffer: null,
            discount: 0,
          },
          false,
          'completeBooking',
        );
      },
    }),
    {
      name: 'BookingStore',
      enabled: __DEV__,
    },
  ),
);

export default useBookingStore;
