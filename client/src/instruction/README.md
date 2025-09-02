# Test Instruction Templates

Bộ sưu tập các mẫu instruction test view point cho AI generate test case và test script, tập trung vào **Unit Testing**.

## 📁 Cấu trúc thư mục

```
instruction/
├── index.json                    # File tổng hợp tất cả templates
├── javascript-ut-templates.json  # Templates cho JavaScript (Jest)
├── java-ut-templates.json        # Templates cho Java (JUnit 5)
├── python-ut-templates.json      # Templates cho Python (pytest)
└── README.md                     # Hướng dẫn sử dụng
```

## 🎯 Mục đích

Các template này được thiết kế để:

- **Hướng dẫn AI** trong việc generate test cases và test scripts
- **Đảm bảo coverage** đầy đủ các khía cạnh testing
- **Chuẩn hóa** cách tiếp cận testing cho từng ngôn ngữ
- **Tăng chất lượng** test cases được tạo ra

## 🚀 Cách sử dụng

### 1. Chọn template phù hợp

Dựa vào ngôn ngữ lập trình và testing framework:

- **JavaScript**: Sử dụng `javascript-ut-templates.json` với Jest
- **Java**: Sử dụng `java-ut-templates.json` với JUnit 5  
- **Python**: Sử dụng `python-ut-templates.json` với pytest

### 2. Áp dụng Test Viewpoints

Mỗi template chứa các **viewpoints** khác nhau:

- **Input validation testing**: Test với các input không hợp lệ
- **Output validation testing**: Kiểm tra output đúng định dạng
- **Edge case testing**: Test với các trường hợp đặc biệt
- **Error handling testing**: Test xử lý lỗi
- **Boundary value testing**: Test với giá trị biên

### 3. Sử dụng Test Patterns

Áp dụng các mẫu thiết kế test:

- **Arrange-Act-Assert (AAA)**: Chuẩn bị - Thực thi - Kiểm tra
- **Given-When-Then**: Cho trước - Khi - Thì
- **Setup-Execute-Verify**: Thiết lập - Thực thi - Xác minh

### 4. Tập trung vào Coverage

Đảm bảo đạt được các loại coverage:

- **Statement coverage**: Bao phủ tất cả các câu lệnh
- **Branch coverage**: Bao phủ tất cả các nhánh logic
- **Function coverage**: Bao phủ tất cả các function/method

## 📋 Ví dụ sử dụng

### JavaScript Function Testing

```javascript
// Sử dụng template "js-ut-function-testing"
describe('calculateSum', () => {
  // Viewpoint: Input validation testing
  test('should handle null input', () => {
    // Arrange
    const input = null;
    
    // Act & Assert
    expect(() => calculateSum(input)).toThrow('Input cannot be null');
  });
  
  // Viewpoint: Edge case testing
  test('should handle empty array', () => {
    // Arrange
    const input = [];
    
    // Act
    const result = calculateSum(input);
    
    // Assert
    expect(result).toBe(0);
  });
});
```

### Java Method Testing

```java
// Sử dụng template "java-ut-method-testing"
@Test
@DisplayName("Should handle null parameters")
void testMethodWithNullParameters() {
    // Arrange
    String input = null;
    
    // Act & Assert
    assertThrows(IllegalArgumentException.class, 
                 () -> utilityMethod(input));
}
```

### Python Class Testing

```python
# Sử dụng template "python-ut-class-testing"
class TestCalculator:
    def test_init_with_valid_parameters(self):
        # Arrange & Act
        calc = Calculator(10, 20)
        
        # Assert
        assert calc.value1 == 10
        assert calc.value2 == 20
```

## 🔧 Tùy chỉnh

Bạn có thể:

1. **Thêm viewpoints mới** vào các template
2. **Tạo template mới** cho ngôn ngữ khác
3. **Mở rộng examples** với các trường hợp cụ thể
4. **Thêm best practices** mới

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
