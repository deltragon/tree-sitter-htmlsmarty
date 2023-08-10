; inherits: html
(smarty_comment) @comment
(smarty_variable_name) @variable

(smarty_member_access_expression
  name: (smarty_name) @property)

(smarty_function_call
  function_name: (smarty_name) @function)

(smarty_string) @string
(smarty_integer) @number
(smarty_float) @number
(smarty_boolean) @constant.builtin
(smarty_null) @constant.builtin

"if" @keyword
"elseif" @keyword
"else" @keyword
"foreach" @keyword
"as" @keyword
"function" @keyword
