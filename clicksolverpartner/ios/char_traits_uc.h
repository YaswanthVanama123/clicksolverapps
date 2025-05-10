// ios/char_traits_uc.h
#pragma once
#include <string>

namespace std {
  // Full specialization so std::basic_string_view<unsigned char> compiles
  template<>
  struct char_traits<unsigned char> {
    using char_type   = unsigned char;
    using int_type    = int;
    using off_type    = ptrdiff_t;
    using pos_type    = fpos<off_type>;
    using state_type  = mbstate_t;

    static void     assign(char_type& r, const char_type& a) noexcept { r = a; }
    static bool     eq(char_type a, char_type b) noexcept           { return a == b; }
    static bool     lt(char_type a, char_type b) noexcept           { return a < b; }
    static int      compare(const char_type* s1, const char_type* s2, size_t n) {
                      for (size_t i = 0; i < n; ++i)
                        if (s1[i] != s2[i]) return s1[i] < s2[i] ? -1 : 1;
                      return 0;
                    }
    static size_t   length(const char_type* s) {
                      size_t i = 0; while (s[i] != 0) ++i; return i;
                    }
    static const char_type* find(const char_type* s, size_t n, const char_type& a) {
                      for (size_t i = 0; i < n; ++i)
                        if (s[i] == a) return s + i;
                      return nullptr;
                    }
    static char_type*  move(char_type* s1, const char_type* s2, size_t n) {
                      return static_cast<char_type*>(memmove(s1, s2, n));
                    }
    static char_type*  copy(char_type* s1, const char_type* s2, size_t n) {
                      return static_cast<char_type*>(memcpy(s1, s2, n));
                    }
    static char_type*  assign(char_type* s, size_t n, char_type a) {
                      for (size_t i = 0; i < n; ++i) s[i] = a;
                      return s;
                    }
    static int_type   not_eof(int_type c) noexcept {
                      return (c == EOF) ? 0 : c;
                    }
    static char_type  to_char_type(int_type c) noexcept {
                      return static_cast<char_type>(c);
                    }
    static int_type   to_int_type(char_type c) noexcept {
                      return static_cast<unsigned char>(c);
                    }
    static bool       eq_int_type(int_type c1, int_type c2) noexcept {
                      return c1 == c2;
                    }
    static int_type   eof() noexcept { return EOF; }
  };
}
