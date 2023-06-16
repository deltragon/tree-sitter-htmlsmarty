const html = require("tree-sitter-html/grammar");

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

    // in text
    // FIXME: see comment in test/corpus/unpaired.txt for why this is broken in the edge case of
    // `text {<valid-tag/>`
    text: $ => /([^<>{]|\{[^*<>])+/,

    _node: $ => choice(
      $.doctype,
      $.text,
      $.smarty_comment,
      $.element,
      $.script_element,
      $.style_element,
      $.erroneous_end_tag
    ),

    // in attribute lists
    _attribute: $ => choice(
      $.attribute,
      $.smarty_comment,
    ),

    attribute_name: $ => /([^<>"'/=\s{]|\{[^*<>"'/=\s{])+/,

    sq_attribute_value_fragment: $ => repeat1(choice(
      /([^'{]|\{[^*'])+/,
      $.smarty_comment
    )),
    dq_attribute_value_fragment: $ => repeat1(choice(
      /([^"{]|\{[^*"])+/,
      $.smarty_comment
    )),

    quoted_attribute_value: $ => choice(
      seq("'", optional(alias($.sq_attribute_value_fragment, $.attribute_value)), optional("{"), "'"),
      seq('"', optional(alias($.dq_attribute_value_fragment, $.attribute_value)), optional("{"), '"'),
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