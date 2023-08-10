const html = require("tree-sitter-html/grammar");

// taken from tree-sitter-php
const PREC = {
  COMMA: -1,
  CAST: -1,
  LOGICAL_OR_2: 1,
  LOGICAL_XOR: 2,
  LOGICAL_AND_2: 3,
  ASSIGNMENT: 4,
  TERNARY: 5,
  NULL_COALESCE: 6,
  LOGICAL_OR_1: 7,
  LOGICAL_AND_1: 8,
  BITWISE_OR: 9,
  BITWISE_XOR: 10,
  BITWISE_AND: 11,
  EQUALITY: 12,
  INEQUALITY: 13,
  SHIFT: 14,
  PLUS: 15,
  TIMES: 16,
  NEG: 17,
  INSTANCEOF: 18,
  INC: 19,
  SCOPE: 20,
  NEW: 21,
  CALL: 22,
  MEMBER: 23,
  DEREF: 24
};

module.exports = grammar(html, {
  name: "htmlsmarty",

  extras: $ => [
    $.comment,
    // TODO: technically this would be possible too, and a whole lot easier (only needs adjusting text, nothing else)
    // but i dont know if this would then properly work with indentation for eg. smarty_if
    //$.smarty_comment,
    /\s+/,
  ],

  rules: {
    smarty_comment: ($) => seq(
      "{*",
      /[^*]*\*+([^}*][^*]*\*+)*/,
      "}"
    ),

    _smarty_expression: ($) => choice(
      $._smarty_primary_expression,
      $.smarty_binary_expression,
      $.smarty_unary_op_expression,
      $.smarty_parenthesized_expression,
    ),

    _smarty_primary_expression: $ => choice(
      $._smarty_variable,
      $._smarty_literal,
    ),

    // taken from tree-sitter-php
    smarty_binary_expression: $ => choice(
      ...[
        [alias(/and|AND/, 'and'), PREC.LOGICAL_AND_2],
        [alias(/or|OR/, 'or'), PREC.LOGICAL_OR_2],
        [alias(/xor|XOR/, 'xor'), PREC.LOGICAL_XOR],
        ['||', PREC.LOGICAL_OR_1],
        ['&&', PREC.LOGICAL_AND_1],
        //['|', PREC.BITWISE_OR], // no bitwise or, used for pipes
        ['^', PREC.BITWISE_XOR],
        ['&', PREC.BITWISE_AND],
        ['==', PREC.EQUALITY],
        ['!=', PREC.EQUALITY],
        ['<>', PREC.EQUALITY],
        ['===', PREC.EQUALITY],
        ['!==', PREC.EQUALITY],
        ['<', PREC.INEQUALITY],
        ['>', PREC.INEQUALITY],
        ['<=', PREC.INEQUALITY],
        ['>=', PREC.INEQUALITY],
        //['<=>', PREC.EQUALITY], // no spaceship operator
        //['<<', PREC.SHIFT], // no shift
        //['>>', PREC.SHIFT], // no shift
        ['+', PREC.PLUS],
        ['-', PREC.PLUS],
        //['.', PREC.PLUS], // no concatenation, used for member access
        ['*', PREC.TIMES],
        ['/', PREC.TIMES],
        ['%', PREC.TIMES],
      ].map(([op, p]) => prec.left(p, seq(
        field('left', $._smarty_expression),
        field('operator', op),
        field('right', $._smarty_expression)
      )))
    ),

    smarty_unary_op_expression: $ => prec.left(PREC.NEG, seq(
      choice(
        '+',
        '-',
        //'~', // no bitwise negation
        '!'
      ),
      $._smarty_expression
    )),

    smarty_parenthesized_expression: $ => seq(
      '(',
      $._smarty_expression,
      ')',
    ),

    _smarty_variable: ($) => choice(
      $.smarty_variable_name,
      $.smarty_member_access_expression,
    ),

    _smarty_literal: ($) => choice(
      $.smarty_string,
      $.smarty_integer,
      $.smarty_float,
      $.smarty_boolean,
      $.smarty_null,
    ),

    smarty_member_access_expression: ($) => seq(
      $._smarty_variable,
      '.',
      $._smarty_member_name,
    ),

    _smarty_member_name: ($) => field('name', $.smarty_name),

    smarty_interpolation: ($) => seq(
      '{',
      $._smarty_expression,
      '}'
    ),

    smarty_assignment: ($) => seq(
      '{',
      field('left', $._smarty_variable),
      "=",
      field('right', $._smarty_expression),
      '}'
    ),

    smarty_string: $ => token(choice(
      seq(
        "'",
        repeat(/\\'|\\\\|\\?[^'\\]/),
        "'"
      ),
      seq(
        '"',
        repeat(/\\"|\\\\|\\?[^"\\]/),
        '"'
      )
    )),

    smarty_boolean: $ => /[Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee]/,

    smarty_null: $ => keyword('null', false),

    smarty_float: $ => /\d*((\.\d*)?([eE][\+-]?\d+)|(\.\d*)([eE][\+-]?\d+)?)/,

    smarty_integer: $ => {
      const decimal = /[1-9]\d*/
      const octal = /0[0-7]*/
      const hex = /0[xX][0-9a-fA-F]+/
      const binary = /0[bB][01]+/
      return token(choice(
        decimal,
        octal,
        hex,
        binary
      ))
  },

    smarty_variable_name: $ => seq('$', $.smarty_name),

    smarty_name: $ => /[_a-zA-Z\u00A1-\u00ff][_a-zA-Z\u00A1-\u00ff\d]*/,

    _smarty_if_condition: ($) => choice(
      $._smarty_expression,
    ),

    smarty_if_nodes: ($) => if_with_body(
      $,
      repeat($._node),
      $.smarty_elseif_nodes,
      $.smarty_else_nodes
    ),
    smarty_elseif_nodes: ($) => elseif_with_body($, repeat($._node)),
    smarty_else_nodes: ($) => else_with_body($, repeat($._node)),

    smarty_if_attributes: ($) => if_with_body(
      $,
      repeat($._attribute),
      $.smarty_elseif_attributes,
      $.smarty_else_attributes
    ),
    smarty_elseif_attributes: ($) => elseif_with_body($, repeat($._attribute)),
    smarty_else_attributes: ($) => else_with_body($, repeat($._attribute)),

    smarty_if_attrval_sq: ($) => if_with_body(
      $,
      repeat($._sq_attribute_value_fragment),
      $.smarty_elseif_attrval_sq,
      $.smarty_else_attrval_sq
    ),
    smarty_elseif_attrval_sq: ($) => elseif_with_body($, repeat($._sq_attribute_value_fragment)),
    smarty_else_attrval_sq: ($) => else_with_body($, repeat($._sq_attribute_value_fragment)),

    smarty_if_attrval_dq: ($) => if_with_body(
      $,
      repeat($._dq_attribute_value_fragment),
      $.smarty_elseif_attrval_dq,
      $.smarty_else_attrval_dq
    ),
    smarty_elseif_attrval_dq: ($) => elseif_with_body($, repeat($._dq_attribute_value_fragment)),
    smarty_else_attrval_dq: ($) => else_with_body($, repeat($._dq_attribute_value_fragment)),

    smarty_foreach_header: $ => choice(
      seq(
        $._smarty_expression,
        keyword("as"),
        $.smarty_variable_name
      ),
    ),

    smarty_foreach_nodes: ($) => seq(
      alias("{foreach", "foreach"),
      $.smarty_foreach_header,
      "}",
      repeat($._node),
      "{/",
      keyword("foreach"),
      "}"
    ),

    smarty_function_definition: $ => seq(
      alias("{function", "function"),
      field("function_name", $.smarty_name),
      field("arguments", repeat(seq(
        field("argument_name", $.smarty_name),
        "=",
        field("argument_value", $._smarty_literal),
      ))),
      "}",
      field("body", repeat($._node)),
      "{/",
      keyword("function"),
      "}"
    ),

    smarty_function_call: $ => seq(
      "{",
      field("function_name", $.smarty_name),
      field("arguments", repeat(seq(
        field("argument_name", $.smarty_name),
        "=",
        field("argument_value", $._smarty_expression),
      ))),
      "}"
    ),

    // in text
    // FIXME: see comment in test/corpus/unpaired.txt for why this is broken in the edge case of
    // `text {<valid-tag/>`
    text: $ => /([^<>{])+/,

    _node: $ => choice(
      $.doctype,
      $.text,
      $.smarty_comment,
      $.smarty_if_nodes,
      $.smarty_foreach_nodes,
      $.smarty_interpolation,
      $.smarty_assignment,
      $.smarty_function_definition,
      $.smarty_function_call,
      $.element,
      $.script_element,
      $.style_element,
      $.erroneous_end_tag,
    ),

    // in attribute lists
    _attribute: $ => choice(
      $.attribute,
      $.smarty_comment,
      $.smarty_if_attributes,
      $.smarty_function_call,
    ),

    attribute_name: $ => /[^<>"'/=\s{]+/, // disallow { in attribute names

    // this is necessary as otherwise we get errors
    attribute_value: $ => /[^<>"'=\s{]+/, // disallow { in unqoted attribute values

    _sq_attribute_value_fragment: $ => choice(
      $.smarty_if_attrval_sq,
      $.smarty_comment,
      $.smarty_interpolation,
      $.smarty_function_call,
      /[^'{]+/, // i do not understand how I can allow {, and still give the other rules precedence...
    ),
    _dq_attribute_value_fragment: $ => choice(
      $.smarty_if_attrval_dq,
      $.smarty_comment,
      $.smarty_interpolation,
      $.smarty_function_call,
      /[^"{]+/,
    ),

    quoted_attribute_value: $ => choice(
      seq("'", optional(alias(repeat1($._sq_attribute_value_fragment), $.attribute_value)), optional("{"), "'"),
      seq('"', optional(alias(repeat1($._dq_attribute_value_fragment), $.attribute_value)), optional("{"), '"'),
    ),


    start_tag: $ => seq(
      '<',
      alias($._start_tag_name, $.tag_name),
      repeat($._attribute),
      '>'
    ),

    script_start_tag: $ => seq(
      '<',
      alias($._script_start_tag_name, $.tag_name),
      repeat($._attribute),
      '>'
    ),

    style_start_tag: $ => seq(
      '<',
      alias($._style_start_tag_name, $.tag_name),
      repeat($._attribute),
      '>'
    ),

    self_closing_tag: $ => seq(
      '<',
      alias($._start_tag_name, $.tag_name),
      repeat($._attribute),
      '/>'
    ),
  }
});

function if_with_body($, body, elseif, else_) {
  return seq(
    // TODO: this currently highlights the entire "{if", not just the "if"
    // getting too many conflicts if i try, so just to be sure
    alias("{if", "if"),
    field('condition', $._smarty_if_condition),
    "}",
    field('body', body),
    repeat(field('alternative_condition', elseif)),
    optional(field('alternative', else_)),

    "{/",
    keyword("if"),
    "}"
  );
}

function elseif_with_body($, body) {
  return seq(
    // TODO: this currently highlights the entire "{elseif", not just the "elseif"
    // it gives me a conflict if i try
    alias("{elseif", "elseif"),
    field('condition', $._smarty_if_condition),
    "}",
    field('body', body),
  );
}

function else_with_body($, body) {
  return seq(
    // TODO: this currently highlights the entire "{else", not just the "else"
    // it gives me a conflict if i try
    alias("{else", "else"),
    "}",
    field('body', body),
  );
}

// taken from tree-sitter-php
function keyword(word, aliasAsWord = true) {
  let pattern = ''
  for (const letter of word) {
    pattern += `[${letter}${letter.toLocaleUpperCase()}]`
  }
  let result = new RegExp(pattern)
  if (aliasAsWord) result = alias(result, word)
  return result
}
