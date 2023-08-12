; inherits: html
(smarty_comment) @comment
(smarty_variable_name) @variable

; expressions
(smarty_string) @string
(smarty_integer) @number
(smarty_float) @number
(smarty_boolean) @constant.builtin
(smarty_null) @constant.builtin

(smarty_member_access_expression name: (smarty_name) @property)
(smarty_member_access_expression "." @punctuation.special)
(smarty_filter_expression filter_name: (smarty_name) @function.call)
(smarty_function_call_expression function_name: (smarty_name) @function.call)

; "statements"
(smarty_function_call) @embedded
(smarty_function_call ["{" "}"] @punctuation.special)
(smarty_function_call function_name: (smarty_name) @function.call)

(smarty_interpolation ["{" "}"] @punctuation.special)

(smarty_assignment ["{" "}"] @punctuation.special)

(smarty_function_definition) @embedded
(smarty_function_definition ["{/" "}"] @punctuation.special)

(smarty_if_nodes ["{/" "}"] @punctuation.special)
(smarty_if_nodes alternative_condition: (smarty_elseif_nodes ("}" @punctuation.special)))
(smarty_if_nodes alternative: (smarty_else_nodes ("}" @punctuation.special)))

(smarty_if_attributes) @embedded
(smarty_if_attributes ["{/" "}"] @punctuation.special)
(smarty_if_attributes alternative_condition: (smarty_elseif_attributes ("}" @punctuation.special)))
(smarty_if_attributes alternative: (smarty_else_attributes ("}" @punctuation.special)))

(smarty_if_attrval_sq) @embedded
(smarty_if_attrval_sq ["{/" "}"] @punctuation.special)
(smarty_if_attrval_sq alternative_condition: (smarty_elseif_attrval_sq ("}" @punctuation.special)))
(smarty_if_attrval_sq alternative: (smarty_else_attrval_sq ("}" @punctuation.special)))

(smarty_if_attrval_dq) @embedded
(smarty_if_attrval_dq ["{/" "}"] @punctuation.special)
(smarty_if_attrval_dq alternative_condition: (smarty_elseif_attrval_dq ("}" @punctuation.special)))
(smarty_if_attrval_dq alternative: (smarty_else_attrval_dq ("}" @punctuation.special)))

(smarty_foreach_nodes ["{/" "}"] @punctuation.special)

(attribute_value) @string

"if" @keyword
"elseif" @keyword
"else" @keyword
"foreach" @keyword
"as" @keyword
"function" @keyword

; #eq? is builtin to treesitter (or at least mentioned by the docs),
; #offset! is nvim-treesitter specific, see https://neovim.io/doc/user/treesitter.html#treesitter-directive-offset%21
(
 ("if" @punctuation.special.if_start)
 (#lua-match? @punctuation.special.if_start "^%s*{if")
 (#offset! @punctuation.special.if_start 0 0 0 -2)
)

(
 ("else" @punctuation.special.else_start)
 (#lua-match? @punctuation.special.else_start "^%s*{else")
 (#offset! @punctuation.special.else_start 0 0 0 -4)
)

(
 ("elseif" @punctuation.special.elseif_start)
 (#lua-match? @punctuation.special.elseif_start "^%s*{elseif")
 (#offset! @punctuation.special.elseif_start 0 0 0 -6)
)

(
 ("function" @punctuation.special.function_start)
 (#lua-match? @punctuation.special.function_start "^%s*{function")
 (#offset! @punctuation.special.function_start 0 0 0 -8)
)

(
 ("foreach" @punctuation.special.foreach_start)
 (#lua-match? @punctuation.special.foreach_start "^%s*{foreach")
 (#offset! @punctuation.special.foreach_start 0 0 0 -7)
)
