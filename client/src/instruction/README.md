# Test Instruction Templates

Bộ sưu tập các mẫu instruction đơn giản cho AI generate test cases, tập trung vào **Unit Testing**.

## 📁 Cấu trúc thư mục

```
instruction/
├── index.json                    # File tổng hợp tất cả templates
├── javascript-ut-templates.json  # Templates đơn giản cho JavaScript (Jest)
├── java-ut-templates.json        # Templates đơn giản cho Java (JUnit 5)
├── python-ut-templates.json      # Templates đơn giản cho Python (pytest)
└── README.md                     # Hướng dẫn sử dụng
```

## 🎯 Mục đích

Các template này được thiết kế để:

- **Hướng dẫn AI** tạo test cases đơn giản và hiệu quả
- **Focus vào input/output validation** - điều quan trọng nhất
- **Đơn giản hóa** quá trình tạo test cases
- **Tăng tốc độ** generate test cases

## 🚀 Cách sử dụng

### 1. Chọn template phù hợp

Dựa vào ngôn ngữ lập trình:

- **JavaScript**: Sử dụng `javascript-ut-templates.json` với Jest
- **Java**: Sử dụng `java-ut-templates.json` với JUnit 5  
- **Python**: Sử dụng `python-ut-templates.json` với pytest

### 2. Focus vào Input/Output

Mỗi template tập trung vào:

- **Input validation**: Test với các input khác nhau
- **Output validation**: Kiểm tra kết quả mong đợi
- **Edge cases**: Test với null, empty, boundary values
- **Error handling**: Test xử lý lỗi

### 3. Format đơn giản

Mỗi test case chỉ cần:

- **Input**: Dữ liệu đầu vào
- **Expected**: Kết quả mong đợi
- **Description**: Mô tả ngắn gọn

## 📋 Ví dụ sử dụng

### JavaScript Basic Testing

```javascript
// Sử dụng template "js-basic-testing"
describe('calculateSum', () => {
  test('should return sum of valid numbers', () => {
    // Input: [1, 2, 3]
    // Expected: 6
    expect(calculateSum([1, 2, 3])).toBe(6);
  });
  
  test('should handle empty array', () => {
    // Input: []
    // Expected: 0
    expect(calculateSum([])).toBe(0);
  });
});
```

### Java Basic Testing

```java
// Sử dụng template "java-basic-testing"
@Test
void testMethodWithValidInput() {
    // Input: "hello"
    // Expected: "HELLO"
    assertEquals("HELLO", utilityMethod("hello"));
}
```

### Python Basic Testing

```python
# Sử dụng template "python-basic-testing"
def test_calculate_sum():
    # Input: [1, 2, 3]
    # Expected: 6
    assert calculate_sum([1, 2, 3]) == 6
```

## 🔧 Tùy chỉnh

Bạn có thể:

1. **Thêm instruction mới** vào các template
2. **Tạo template mới** cho ngôn ngữ khác
3. **Đơn giản hóa thêm** các instruction hiện có
4. **Focus vào input/output** validation

## 📚 Tài liệu tham khảo

- **Jest**: https://jestjs.io/
- **JUnit 5**: https://junit.org/junit5/
- **pytest**: https://docs.pytest.org/
- **Testing Best Practices**: https://martinfowler.com/articles/microservice-testing/

## 🤝 Đóng góp

Để cải thiện các template:

1. Fork repository
2. Tạo branch mới
3. Thêm/sửa template
4. Tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.
